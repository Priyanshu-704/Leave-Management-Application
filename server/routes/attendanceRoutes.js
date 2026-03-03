const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
  getAllAttendance,
  getAttendanceStats,
  addBreak,
  endBreak,
  manualAttendance
} = require('../controllers/attendanceController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee routes
router.post('/checkin', checkIn);
router.put('/checkout', checkOut);
router.get('/today', getTodayAttendance);
router.get('/history', getAttendanceHistory);
router.post('/break', addBreak);
router.put('/break/end', endBreak);

// Manager/Admin routes
router.get('/all', authorize('manager', 'admin'), getAllAttendance);
router.get('/stats', authorize('manager', 'admin'), getAttendanceStats);

// Admin only routes
router.post('/manual', authorize('admin'), manualAttendance);

module.exports = router;