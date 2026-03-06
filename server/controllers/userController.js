const User = require("../models/User");
const Leave = require("../models/Leave");
const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { FRONTEND_URL } = require("../config/appConfig");
const { sendAccountCredentialsEmail } = require("../utils/email");
const { FEATURE_ACCESS } = require("../config/featureAccess");
const {
  isSuperAdmin,
  isAdmin,
  canCreateRole,
  canManageTargetUser,
  canAccessDepartment,
} = require("../utils/accessControl");

const generateTemporaryPassword = (length = 10) => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%";
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += chars[crypto.randomInt(0, chars.length)];
  }
  return password;
};

const sanitizeFeaturePermissions = (permissions = {}) => {
  const sanitized = {};
  Object.keys(permissions || {}).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(FEATURE_ACCESS, key)) return;
    if (typeof permissions[key] === "boolean") {
      sanitized[key] = permissions[key];
    }
  });
  return sanitized;
};

const isDepartmentScopedUser = (user) => ["manager"].includes(user?.role);

const ensureDepartmentAccess = (req, targetDepartment) =>
  canAccessDepartment(req.user, targetDepartment);

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const {
      role,
      department,
      isActive,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    if (role) query.role = role;
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === "true";

    if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
      query.department = req.user.department;
      query.role = { $ne: "super_admin" };
    }

    if (isAdmin(req.user) && !isSuperAdmin(req.user)) {
      if (["manager", "employee"].includes(role)) {
        query.role = role;
      } else {
        query.role = { $in: ["manager", "employee"] };
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort("-createdAt");

    const total = await User.countDocuments(query);

    res.json({
      users,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    // If no ID provided, get current user
    const userId = req.params.id || req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      req.params.id &&
      !ensureDepartmentAccess(req, user.department) &&
      user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (isAdmin(req.user) && !isSuperAdmin(req.user) && ["admin", "super_admin"].includes(user.role) && user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get user's leave statistics
    const leaveStats = await Leave.aggregate([
      { $match: { employee: user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalDays: { $sum: "$days" },
        },
      },
    ]);

    const recentLeaves = await Leave.find({ employee: user._id })
      .sort("-appliedOn")
      .limit(5);

    res.json({
      ...user.toObject(),
      leaveStatistics: leaveStats,
      recentLeaves,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let {
      name,
      email,
      password,
      role,
      designation,
      department,
      employeeId,
      dateOfBirth,
      joiningDate,
      leaveBalance,
      sendCredentialsEmail,
    } = req.body;

    if (!canCreateRole(req.user, role || "employee")) {
      return res.status(403).json({
        message: "Only super admin can create admin users. Admin can create manager/employee only.",
      });
    }

    if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
      department = req.user.department;
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (userExists) {
      return res.status(400).json({
        message: "User already exists with this email or employee ID",
      });
    }

    const plainPassword = password || generateTemporaryPassword();
    const shouldSendCredentials = sendCredentialsEmail !== false;

    // Create user
    const user = await User.create({
      name,
      email,
      password: plainPassword,
      role: role || "employee",
      designation: designation || "staff",
      department,
      employeeId,
      dateOfBirth: dateOfBirth || null,
      joiningDate: joiningDate || null,
      forcePasswordChange: true,
      leaveBalance: leaveBalance || {
        annual: 20,
        sick: 10,
        personal: 5,
      },
    });

    let emailWarning = null;
    if (shouldSendCredentials) {
      try {
        await sendAccountCredentialsEmail({
          to: user.email,
          name: user.name,
          email: user.email,
          password: plainPassword,
          loginUrl: `${FRONTEND_URL}/login`,
        });
      } catch (emailError) {
        emailWarning =
          emailError.message || "User created, but failed to send credentials email";
      }
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      employeeId: user.employeeId,
      leaveBalance: user.leaveBalance,
      isActive: user.isActive,
      credentialsSent: shouldSendCredentials && !emailWarning,
      warning: emailWarning,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!ensureDepartmentAccess(req, user.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!canManageTargetUser(req.user, user)) {
      return res.status(403).json({ message: "Not authorized to manage this user" });
    }

    if (!canManageTargetUser(req.user, user) && user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to manage this user" });
    }

    if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
      if (
        req.body.department &&
        req.body.department !== req.user.department
      ) {
        return res.status(403).json({
          message: "Cannot move users to another department",
        });
      }

      if (req.body.role && ["admin", "super_admin"].includes(req.body.role)) {
        return res.status(403).json({
          message: "Only super admin can assign admin-level roles",
        });
      }
    }

    if (isAdmin(req.user) && !isSuperAdmin(req.user) && req.body.role === "admin") {
      return res.status(403).json({
        message: "Only super admin can assign admin role",
      });
    }

    // Check if email is being changed and already exists
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Check if employeeId is being changed and already exists
    if (req.body.employeeId && req.body.employeeId !== user.employeeId) {
      const employeeIdExists = await User.findOne({
        employeeId: req.body.employeeId,
      });
      if (employeeIdExists) {
        return res.status(400).json({ message: "Employee ID already in use" });
      }
    }

    // Update fields
    const updatableFields = [
      "name",
      "email",
      "department",
      "role",
      "designation",
      "employeeId",
      "dateOfBirth",
      "joiningDate",
    ];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Update leave balance if provided
    if (req.body.leaveBalance) {
      user.leaveBalance = {
        ...user.leaveBalance,
        ...req.body.leaveBalance,
      };
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      designation: updatedUser.designation,
      employeeId: updatedUser.employeeId,
      dateOfBirth: updatedUser.dateOfBirth,
      joiningDate: updatedUser.joiningDate,
      leaveBalance: updatedUser.leaveBalance,
      isActive: updatedUser.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!ensureDepartmentAccess(req, user.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!canManageTargetUser(req.user, user)) {
      return res.status(403).json({
        message: "Not authorized to manage this user",
      });
    }

    // Check if user has any pending leaves
    const pendingLeaves = await Leave.findOne({
      employee: user._id,
      status: "pending",
    });

    if (pendingLeaves) {
      return res.status(400).json({
        message: "Cannot delete user with pending leave requests",
      });
    }

    // Soft delete - just deactivate
    user.isActive = false;
    await user.save();

    // Alternatively, for hard delete:
    // await User.findByIdAndDelete(req.params.id);
    // await Leave.deleteMany({ employee: user._id });

    res.json({ message: "User deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["employee", "manager", "admin", "super_admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!ensureDepartmentAccess(req, user.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!canManageTargetUser(req.user, user)) {
      return res.status(403).json({
        message: "Not authorized to update this user role",
      });
    }

    if (!canCreateRole(req.user, role)) {
      return res.status(403).json({
        message: "Only super admin can assign admin role",
      });
    }

    // Prevent removing the last admin
    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot remove the last admin user",
        });
      }
    }

    user.role = role;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      message: "User role updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user leave balance
// @route   PUT /api/users/:id/leave-balance
// @access  Private/Admin
exports.updateLeaveBalance = async (req, res) => {
  try {
    const { annual, sick, personal } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!ensureDepartmentAccess(req, user.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update leave balances
    if (annual !== undefined) user.leaveBalance.annual = annual;
    if (sick !== undefined) user.leaveBalance.sick = sick;
    if (personal !== undefined) user.leaveBalance.personal = personal;

    await user.save();

    res.json({
      message: "Leave balance updated successfully",
      leaveBalance: user.leaveBalance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users' leave balances
// @route   GET /api/users/leave-balances
// @access  Private/Manager/Admin
exports.getUserLeaveBalances = async (req, res) => {
  try {
    const { department } = req.query;

    let query = { isActive: true };
    if (department) query.department = department;

    if (isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)) {
      query.department = req.user.department;
    }
    if (isAdmin(req.user) && !isSuperAdmin(req.user)) {
      query.role = { $in: ["manager", "employee"] };
    }

    const users = await User.find(query)
      .select("name email employeeId department leaveBalance role")
      .sort("department name");

    // Get used leave counts for each user
    const usersWithUsedLeaves = await Promise.all(
      users.map(async (user) => {
        const usedLeaves = await Leave.aggregate([
          {
            $match: {
              employee: user._id,
              status: "approved",
              leaveType: { $ne: "unpaid" },
            },
          },
          {
            $group: {
              _id: "$leaveType",
              totalDays: { $sum: "$days" },
            },
          },
        ]);

        const used = {
          annual: 0,
          sick: 0,
          personal: 0,
        };

        usedLeaves.forEach((item) => {
          used[item._id] = item.totalDays;
        });

        return {
          ...user.toObject(),
          usedLeaves: used,
          remainingLeaves: {
            annual: user.leaveBalance.annual - used.annual,
            sick: user.leaveBalance.sick - used.sick,
            personal: user.leaveBalance.personal - used.personal,
          },
        };
      }),
    );

    res.json(usersWithUsedLeaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk update leave balances
// @route   POST /api/users/bulk-update-leave-balances
// @access  Private/Admin
exports.bulkUpdateLeaveBalances = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { userId, annual, sick, personal }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    if (!isSuperAdmin(req.user)) {
      const targetUsers = await User.find({
        _id: { $in: updates.map((u) => u.userId) },
      }).select("department role");

      const hasOutOfScopeUser = targetUsers.some(
        (u) =>
          !canAccessDepartment(req.user, u.department) ||
          ["admin", "super_admin"].includes(u.role),
      );
      if (hasOutOfScopeUser || targetUsers.length !== updates.length) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    const operations = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.userId },
        update: {
          $set: {
            "leaveBalance.annual": update.annual,
            "leaveBalance.sick": update.sick,
            "leaveBalance.personal": update.personal,
          },
        },
      },
    }));

    const result = await User.bulkWrite(operations);

    res.json({
      message: "Bulk update completed",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users by department
// @route   GET /api/users/department/:department
// @access  Private/Manager/Admin
exports.getDepartmentUsers = async (req, res) => {
  try {
    if (
      isDepartmentScopedUser(req.user) &&
      !isSuperAdmin(req.user) &&
      !canAccessDepartment(req.user, req.params.department)
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const users = await User.find({
      department: req.params.department,
      isActive: true,
    })
      .select("name email employeeId role leaveBalance")
      .sort("name");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!ensureDepartmentAccess(req, user.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!canManageTargetUser(req.user, user)) {
      return res.status(403).json({
        message: "Not authorized to manage this user",
      });
    }

    // Prevent deactivating the last admin
    if (user.role === "admin" && user.isActive) {
      const adminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot deactivate the last active admin",
        });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user permission overrides
// @route   PUT /api/users/:id/permissions
// @access  Private/Admin
exports.updateUserPermissions = async (req, res) => {
  try {
    const { featurePermissions = {}, allowCrossDepartment, allowedDepartments = [] } = req.body || {};

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canManageTargetUser(req.user, user)) {
      return res.status(403).json({ message: "Not authorized to manage this user" });
    }

    const sanitizedPermissions = sanitizeFeaturePermissions(featurePermissions);
    user.featurePermissions = sanitizedPermissions;

    if (typeof allowCrossDepartment === "boolean") {
      user.allowCrossDepartment = allowCrossDepartment;
    }

    user.allowedDepartments = Array.isArray(allowedDepartments)
      ? allowedDepartments.filter(Boolean)
      : [];

    await user.save();

    return res.json({
      success: true,
      message: "User permissions updated successfully",
      data: {
        userId: user._id,
        featurePermissions: user.featurePermissions,
        allowCrossDepartment: user.allowCrossDepartment,
        allowedDepartments: user.allowedDepartments,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk update permissions for a department
// @route   PUT /api/users/permissions/department/:department
// @access  Private/Admin
exports.updateDepartmentPermissions = async (req, res) => {
  try {
    const { department } = req.params;
    const { featurePermissions = {}, allowCrossDepartment, allowedDepartments = [] } = req.body || {};

    if (!isSuperAdmin(req.user) && !isAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const sanitizedPermissions = sanitizeFeaturePermissions(featurePermissions);
    const update = {
      featurePermissions: sanitizedPermissions,
    };

    if (typeof allowCrossDepartment === "boolean") {
      update.allowCrossDepartment = allowCrossDepartment;
    }

    update.allowedDepartments = Array.isArray(allowedDepartments)
      ? allowedDepartments.filter(Boolean)
      : [];

    const result = await User.updateMany(
      {
        department,
        role: { $in: ["employee", "manager"] },
      },
      { $set: update },
    );

    return res.json({
      success: true,
      message: "Department permissions updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile (self)
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update allowed fields
    const { name, email } = req.body;

    if (name) user.name = name;

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    user.forcePasswordChange = false;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send fresh temporary credentials to user
// @route   POST /api/users/:id/send-credentials
// @access  Private/Admin
exports.sendCredentialsToUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!ensureDepartmentAccess(req, user.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!canManageTargetUser(req.user, user)) {
      return res.status(403).json({
        message: "Not authorized to manage this user",
      });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: "Cannot send credentials to inactive user" });
    }

    const temporaryPassword = generateTemporaryPassword();
    user.password = temporaryPassword;
    user.forcePasswordChange = true;
    await user.save();

    await sendAccountCredentialsEmail({
      to: user.email,
      name: user.name,
      email: user.email,
      password: temporaryPassword,
      loginUrl: `${FRONTEND_URL}/login`,
    });

    return res.json({
      success: true,
      message: `Temporary credentials sent to ${user.email}`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/statistics
// @access  Private/Manager/Admin
exports.getUserStatistics = async (req, res) => {
  try {
    const userMatch =
      isDepartmentScopedUser(req.user) && !isSuperAdmin(req.user)
        ? { department: req.user.department, role: { $ne: "super_admin" } }
        : isAdmin(req.user) && !isSuperAdmin(req.user)
          ? { role: { $in: ["manager", "employee"] } }
          : {};

    const totalUsers = await User.countDocuments(userMatch);
    const activeUsers = await User.countDocuments({ ...userMatch, isActive: true });

    const roleStats = await User.aggregate([
      { $match: userMatch },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const departmentStats = await User.aggregate([
      { $match: userMatch },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
    ]);

    const scopedUsers = await User.find(userMatch).select("_id");
    const scopedUserIds = scopedUsers.map((u) => u._id);

    const leaveMatch =
      scopedUserIds.length > 0 || Object.keys(userMatch).length === 0
        ? Object.keys(userMatch).length === 0
          ? {}
          : { employee: { $in: scopedUserIds } }
        : { employee: null };

    const leaveStats = await Leave.aggregate([
      { $match: leaveMatch },
      {
        $group: {
          _id: {
            status: "$status",
            month: { $month: "$appliedOn" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get users with most leaves taken
    const topLeaveTakers = await Leave.aggregate([
      { $match: { status: "approved", ...leaveMatch } },
      {
        $group: {
          _id: "$employee",
          totalLeaves: { $sum: "$days" },
          leaveCount: { $sum: 1 },
        },
      },
      { $sort: { totalLeaves: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          "user.name": 1,
          "user.email": 1,
          "user.department": 1,
          totalLeaves: 1,
          leaveCount: 1,
        },
      },
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
      },
      byRole: roleStats,
      byDepartment: departmentStats,
      leaveTrends: leaveStats,
      topLeaveTakers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users by department for department head selection
// @route   GET /api/users/department/:departmentName/candidates
// @access  Private/Admin
exports.getDepartmentHeadCandidates = async (req, res) => {
  try {
    const { departmentName } = req.params;
    const { excludeUserId } = req.query;

    // Decode the department name
    const decodedDeptName = decodeURIComponent(departmentName);

    console.log("Fetching head candidates for department:", decodedDeptName);

    if (
      isDepartmentScopedUser(req.user) &&
      !isSuperAdmin(req.user) &&
      !canAccessDepartment(req.user, decodedDeptName)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Build query
    let query = {
      department: decodedDeptName,
      isActive: true,
      role: { $in: ["employee", "manager"] }, // Only employees and managers can be heads
    };

    // Exclude current head if specified
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    // Find users
    const users = await User.find(query)
      .select("name email employeeId role department")
      .sort("name");

    console.log(`Found ${users.length} candidates`);

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching department head candidates:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if exists (optional)
    if (user.profilePicture) {
      const oldPicturePath = path.join(__dirname, "..", user.profilePicture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Save profile picture path to user
    const pictureUrl = `/uploads/profiles/${req.file.filename}`;
    user.profilePicture = pictureUrl;
    await user.save();

    res.json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: { profilePicture: pictureUrl },
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: error.message });
  }
};
