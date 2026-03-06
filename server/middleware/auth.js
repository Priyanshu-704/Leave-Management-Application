const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginHistory = require("../models/LoginHistory");
const { hasFeatureAccess } = require("../config/featureAccess");
const { parseCookies } = require("../utils/httpCookies");
const { ACCESS_TOKEN_SECRET } = require("../config/appConfig");

exports.protect = async (req, res, next) => {
  let token = null;
  const cookies = parseCookies(req.headers.cookie || "");
  token = cookies.accessToken || null;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.user.activeSessionId && decoded.sessionId !== req.user.activeSessionId) {
      return res.status(401).json({ message: 'Session expired. You have logged in on another device.' });
    }

    if (decoded.sessionId) {
      LoginHistory.findOneAndUpdate(
        { user: req.user._id, sessionId: decoded.sessionId, isActive: true },
        { lastSeenAt: new Date() },
      ).catch(() => {});
    }
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Super admin has global access
    if (req.user?.role === "super_admin") {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized to access this resource` 
      });
    }
    next();
  };
};

exports.authorizeFeature = (featureKey) => {
  return (req, res, next) => {
    if (!hasFeatureAccess(req.user, featureKey)) {
      return res.status(403).json({
        message: "Unauthorized access",
        code: "FEATURE_ACCESS_DENIED",
        feature: featureKey,
      });
    }
    next();
  };
};
