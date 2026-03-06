const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getPublicSettings,
  getSettings,
  updateSettings,
  getSettingsSection,
  getAuditLog,
  resetSettings,
  testEmailSettings,
  getSystemStatus
} = require('../controllers/settingsController');

const router = express.Router();

// Public settings route for all users (including logged-out users)
router.get('/public', getPublicSettings);

// All settings routes require admin access
router.use(protect);
router.use(authorize('admin'));

// Main settings routes
router.get('/', getSettings);
router.put('/', updateSettings);
router.get('/audit', getAuditLog);
router.get('/status', getSystemStatus);
router.post('/reset', resetSettings);
router.post('/test-email', testEmailSettings);

// Section-specific routes
router.get('/:section', getSettingsSection);

module.exports = router;
