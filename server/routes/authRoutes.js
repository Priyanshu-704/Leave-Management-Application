const express = require('express');
const {
  register,
  login,
  refresh,
  precheckLoginSession,
  getMe,
  forgotPassword,
  resetPassword,
  getLoginHistory,
  logoutCurrentSession,
  updateTwoFactorSetting,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require("../middleware/joiValidation");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/authValidators");
const router = express.Router();

router.post('/register', protect, authorize("admin"), validate(registerSchema), register);

router.post("/login/precheck", validate(loginSchema), precheckLoginSession);
router.post('/login', validate(loginSchema), login);
router.post("/refresh", refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post(
  '/reset-password/:token',
  validate(resetPasswordSchema),
  resetPassword,
);

// Protected route
router.get('/me', protect, getMe);
router.get("/login-history", protect, getLoginHistory);
router.put("/two-factor", protect, updateTwoFactorSetting);
router.post("/logout-session", protect, logoutCurrentSession);
router.post("/logout-session/:sessionId", protect, logoutCurrentSession);

module.exports = router;
