const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const {
  uploadFile,
  getFiles,
  getFileById,
  downloadFile,
  updateFile,
  deleteFile,
  uploadNewVersion,
  getFileStats
} = require('../controllers/fileController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    
    // Organize by file type
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else if (file.mimetype === 'application/pdf') {
      uploadPath += 'pdfs/';
    } else if (file.mimetype.includes('document') || file.mimetype.includes('word')) {
      uploadPath += 'documents/';
    } else {
      uploadPath += 'others/';
    }
    
    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only documents, images, PDFs, and spreadsheets are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// All routes require authentication
router.use(protect);

// File management routes
router.post('/upload', 
  authorize('admin', 'manager'),
  upload.single('file'),
  uploadFile
);

router.get('/', getFiles);
router.get('/stats', authorize('admin'), getFileStats);
router.get('/:id', getFileById);
router.get('/:id/download', downloadFile);
router.put('/:id', updateFile);
router.delete('/:id', deleteFile);
router.post('/:id/version',
  authorize('admin', 'manager'),
  upload.single('file'),
  uploadNewVersion
);

module.exports = router;