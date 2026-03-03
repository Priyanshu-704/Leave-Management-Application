const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  acknowledgeAnnouncement,
  addComment,
  getAnnouncementStats
} = require('../controllers/announcementController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (accessible by authenticated users)
router.get('/', getAnnouncements);
router.get('/stats', authorize('admin'), getAnnouncementStats);
router.get('/:id', getAnnouncementById);

// Protected routes
router.post('/', 
  authorize('admin', 'manager'), 
  createAnnouncement
);

router.put('/:id', 
  authorize('admin', 'manager'), 
  updateAnnouncement
);

router.delete('/:id', 
  authorize('admin', 'manager'), 
  deleteAnnouncement
);

// Interaction routes
router.post('/:id/acknowledge', acknowledgeAnnouncement);
router.post('/:id/comments', addComment);

module.exports = router;