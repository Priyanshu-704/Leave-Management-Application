const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Leave = require("../models/Leave");
const crypto = require("crypto");
const LoginHistory = require("../models/LoginHistory");
const { parseDeviceName, buildDeviceFingerprint } = require("../utils/device");
const { parseCookies, setAuthCookies, clearAuthCookies } = require("../utils/httpCookies");
const { ensureSystemNotificationsForUser } = require("./notificationController");
const { FEATURE_ACCESS, hasFeatureAccess } = require("../config/featureAccess");
const {
  isSuperAdmin,
  isAdmin,
  canCreateRole,
} = require("../utils/accessControl");
const {
  FRONTEND_URL,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} = require("../config/appConfig");
const {
  sendPasswordResetEmail,
  sendTwoFactorCodeEmail,
  sendNewDeviceLoginAlertEmail,
} = require("../utils/email");

const generateAccessToken = (id, sessionId) =>
  jwt.sign({ id, sessionId, tokenType: "access" }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

const generateRefreshToken = (id, sessionId) =>
  jwt.sign({ id, sessionId, tokenType: "refresh" }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const issueAuthTokens = async (user, sessionId, res) => {
  const accessToken = generateAccessToken(user._id, sessionId);
  const refreshToken = generateRefreshToken(user._id, sessionId);
  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();
  setAuthCookies(res, accessToken, refreshToken);
};

const authUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  designation: user.designation,
  department: user.department,
  featurePermissions: user.featurePermissions || {},
  allowCrossDepartment: !!user.allowCrossDepartment,
  allowedDepartments: user.allowedDepartments || [],
  twoFactorEnabled: !!user.twoFactorEnabled,
  isSuperAdmin: user.role === "super_admin",
  forcePasswordChange: user.forcePasswordChange || false,
});

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      designation,
      department,
      employeeId,
      dateOfBirth,
      joiningDate,
    } = req.body;

    if (!req.user || (!isSuperAdmin(req.user) && !isAdmin(req.user))) {
      return res.status(403).json({ message: "Not authorized to register users" });
    }

    if (!canCreateRole(req.user, role || "employee")) {
      return res.status(403).json({
        message: "Only super admin can create admin users. Admin can create manager/employee only.",
      });
    }

    const finalDepartment =
      isAdmin(req.user) && !isSuperAdmin(req.user) && req.body.department
        ? req.body.department
        : department;

    const userExists = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      designation,
      department: finalDepartment,
      employeeId,
      dateOfBirth: dateOfBirth || null,
      joiningDate: joiningDate || null,
    });

    const sessionId = crypto.randomUUID();
    user.activeSessionId = sessionId;
    await user.save();

    await LoginHistory.create({
      user: user._id,
      sessionId,
      ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      deviceName: parseDeviceName(req.headers["user-agent"]),
    });

    await issueAuthTokens(user, sessionId, res);

    res.status(201).json(authUserPayload(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
      takeoverExistingSession = false,
      twoFactorCode,
    } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";
    const deviceName = parseDeviceName(userAgent);
    const deviceFingerprint = buildDeviceFingerprint({ userAgent, ipAddress });
    const knownDevice = (user.knownDevices || []).find(
      (device) => device.fingerprint === deviceFingerprint,
    );
    const isNewDevice = !knownDevice;

    const activeSession = await LoginHistory.findOne({
      user: user._id,
      sessionId: user.activeSessionId,
      isActive: true,
    }).sort({ loginAt: -1 });

    if (activeSession && !takeoverExistingSession) {
      return res.status(409).json({
        message:
          "You are already logged in on another device. Continuing will log out the previous device.",
        code: "ACTIVE_SESSION_EXISTS",
        activeSession: {
          deviceName: activeSession.deviceName,
          ipAddress: activeSession.ipAddress,
          loginAt: activeSession.loginAt,
          lastSeenAt: activeSession.lastSeenAt,
        },
      });
    }

    const sessionId = user.twoFactorPendingSessionId || crypto.randomUUID();

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        const rawCode = String(Math.floor(100000 + Math.random() * 900000));
        user.twoFactorCodeHash = hashToken(rawCode);
        user.twoFactorCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        user.twoFactorPendingSessionId = sessionId;
        user.twoFactorPendingDeviceFingerprint = deviceFingerprint;
        await user.save();

        await sendTwoFactorCodeEmail({
          to: user.email,
          name: user.name,
          code: rawCode,
          deviceName,
        });

        return res.status(202).json({
          requiresTwoFactor: true,
          message: "Verification code sent to your email",
          deviceName,
          isNewDevice,
        });
      }

      const codeValid =
        user.twoFactorCodeHash &&
        user.twoFactorCodeExpiresAt &&
        user.twoFactorCodeExpiresAt > new Date() &&
        user.twoFactorPendingDeviceFingerprint === deviceFingerprint &&
        user.twoFactorCodeHash === hashToken(String(twoFactorCode));

      if (!codeValid) {
        return res.status(401).json({ message: "Invalid or expired verification code" });
      }
    }

    await LoginHistory.updateMany(
      { user: user._id, isActive: true },
      { isActive: false, logoutAt: new Date() },
    );

    user.activeSessionId = sessionId;
    user.twoFactorCodeHash = null;
    user.twoFactorCodeExpiresAt = null;
    user.twoFactorPendingSessionId = null;
    user.twoFactorPendingDeviceFingerprint = null;
    await user.save();

    const loginRecord = await LoginHistory.create({
      user: user._id,
      sessionId,
      ipAddress,
      userAgent,
      deviceName,
    });

    if (isNewDevice) {
      user.knownDevices = [...(user.knownDevices || []), {
        fingerprint: deviceFingerprint,
        deviceName,
        ipAddress,
        lastLoginAt: new Date(),
      }].slice(-10);
      await user.save();

      sendNewDeviceLoginAlertEmail({
        to: user.email,
        name: user.name,
        deviceName,
        ipAddress,
        loginAt: loginRecord.loginAt,
      }).catch(() => {});
    } else {
      user.knownDevices = (user.knownDevices || []).map((device) => {
        if (device.fingerprint !== deviceFingerprint) return device;
        return {
          fingerprint: device.fingerprint,
          deviceName,
          ipAddress,
          lastLoginAt: new Date(),
        };
      });
      await user.save();
    }

    await issueAuthTokens(user, sessionId, res);

    res.json(authUserPayload(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh access token using refresh token cookie
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const refreshToken = cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    if (decoded?.tokenType !== "refresh") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Refresh token invalid" });
    }

    if (user.refreshTokenExpiresAt && new Date(user.refreshTokenExpiresAt) < new Date()) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Refresh token expired" });
    }

    if (user.activeSessionId && decoded.sessionId !== user.activeSessionId) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Session expired" });
    }

    await issueAuthTokens(user, decoded.sessionId || user.activeSessionId, res);

    return res.json({ success: true });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Invalid refresh session" });
  }
};

// @desc    Check if active session exists for credentials
// @route   POST /api/auth/login/precheck
// @access  Public
exports.precheckLoginSession = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const activeSession = user.activeSessionId
      ? await LoginHistory.findOne({
          user: user._id,
          sessionId: user.activeSessionId,
          isActive: true,
        }).sort({ loginAt: -1 })
      : null;

    return res.json({
      hasActiveSession: Boolean(activeSession),
      activeSession: activeSession
        ? {
            deviceName: activeSession.deviceName,
            ipAddress: activeSession.ipAddress,
            loginAt: activeSession.loginAt,
            lastSeenAt: activeSession.lastSeenAt,
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return generic response to avoid user enumeration
    if (!user || !user.isActive) {
      return res.json({
        success: true,
        message:
          "If an account with that email exists, password reset instructions were sent.",
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        message: emailError.message || "Failed to send reset email",
      });
    }

    return res.json({
      success: true,
      message:
        "If an account with that email exists, password reset instructions were sent.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset token is invalid or expired" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.forcePasswordChange = false;
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get pending leave count
    const pendingLeaves = await Leave.countDocuments({
      employee: req.user.id,
      status: "pending",
    });

    await ensureSystemNotificationsForUser(user);

    // Get recent activities
    const recentActivities = await Leave.find({
      employee: req.user.id,
    })
      .sort("-appliedOn")
      .limit(5)
      .select("leaveType status days appliedOn");

    res.json({
      ...user.toObject(),
      pendingLeaves,
      recentActivities,
      featureAccess: Object.keys(FEATURE_ACCESS).reduce((acc, key) => {
        acc[key] = hasFeatureAccess(user, key);
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get login history and active session info
// @route   GET /api/auth/login-history
// @access  Private
exports.getLoginHistory = async (req, res) => {
  try {
    const records = await LoginHistory.find({ user: req.user.id })
      .sort({ loginAt: -1 })
      .limit(20);

    res.json({
      activeSessionId: req.user.activeSessionId || null,
      records,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update two-factor setting for current user
// @route   PUT /api/auth/two-factor
// @access  Private
exports.updateTwoFactorSetting = async (req, res) => {
  try {
    const { enabled } = req.body || {};
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "enabled must be boolean" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.twoFactorEnabled = enabled;
    if (!enabled) {
      user.twoFactorCodeHash = null;
      user.twoFactorCodeExpiresAt = null;
      user.twoFactorPendingSessionId = null;
      user.twoFactorPendingDeviceFingerprint = null;
    }
    await user.save();

    return res.json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled,
      message: `Two-factor authentication ${enabled ? "enabled" : "disabled"}`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Logout current session
// @route   POST /api/auth/logout-session
// @access  Private
exports.logoutCurrentSession = async (req, res) => {
  try {
    const requestedSessionId = req.params.sessionId;
    const currentSessionId = req.user.activeSessionId;
    const sessionId = requestedSessionId || currentSessionId;

    if (!sessionId) {
      return res.status(400).json({ message: "No active session found" });
    }

    const record = await LoginHistory.findOne({
      user: req.user.id,
      sessionId,
    });

    if (!record) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (sessionId === currentSessionId) {
      await User.findByIdAndUpdate(req.user.id, {
        activeSessionId: null,
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      });
      clearAuthCookies(res);
    }

    await LoginHistory.findOneAndUpdate(
      { user: req.user.id, sessionId, isActive: true },
      { isActive: false, logoutAt: new Date() },
    );

    res.json({ success: true, sessionId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
