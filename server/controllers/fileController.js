const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// @desc    Upload file
// @route   POST /api/files/upload
// @access  Private (Admin/Manager)
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const {
      category,
      description,
      tags,
      accessType,
      allowedRoles,
      allowedDepartments,
      allowedUsers,
      allowDownload,
      password,
      expiryDate,
      folderId
    } = req.body;

    // Parse JSON fields
    const parsedTags = tags ? JSON.parse(tags) : [];
    const parsedAllowedRoles = allowedRoles ? JSON.parse(allowedRoles) : ['employee'];
    const parsedAllowedDepartments = allowedDepartments ? JSON.parse(allowedDepartments) : [];
    const parsedAllowedUsers = allowedUsers ? JSON.parse(allowedUsers) : [];

    // Create file URL (you can use CDN or local storage)
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      fileExtension: path.extname(req.file.originalname),
      url: fileUrl,
      path: req.file.path,
      category: category || 'document',
      description,
      tags: parsedTags,
      accessControl: {
        type: accessType || 'restricted',
        allowedRoles: parsedAllowedRoles,
        allowedDepartments: parsedAllowedDepartments,
        allowedUsers: parsedAllowedUsers,
        allowDownload: allowDownload !== 'false',
        password: password || undefined,
        expiryDate: expiryDate || undefined
      },
      uploadedBy: req.user.id,
      uploadedByRole: req.user.role,
      department: req.user.department,
      folder: folderId || undefined
    };

    // If manager, restrict to their department
    if (req.user.role === 'manager') {
      fileData.accessControl.allowedDepartments = [req.user.department];
      fileData.department = req.user.department;
    }

    const file = await File.create(fileData);

    // Log activity
    await file.logActivity(req.user.id, 'upload', req);
    await file.save();

    // Populate user info
    await file.populate('uploadedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: file
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all files (with filters)
// @route   GET /api/files
// @access  Private
exports.getFiles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      department,
      type,
      search,
      folder,
      showArchived = false
    } = req.query;

    let query = { isActive: true };

    // Filter by archived
    if (showArchived === 'true') {
      query.isArchived = true;
    } else {
      query.isArchived = false;
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by department
    if (department && department !== 'all') {
      query.department = department;
    }

    // Filter by folder
    if (folder && folder !== 'all') {
      query.folder = folder === 'null' ? null : folder;
    }

    // Search
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by file type
    if (type && type !== 'all') {
      query.fileType = { $regex: type, $options: 'i' };
    }

    // Role-based filtering
    if (req.user.role === 'admin') {
      // Admin sees everything
    } else if (req.user.role === 'manager') {
      // Managers see their department files + public files
      query.$or = [
        { department: req.user.department },
        { 'accessControl.type': 'public' },
        { uploadedBy: req.user.id },
        { 'accessControl.allowedDepartments': req.user.department }
      ];
    } else {
      // Employees see files they can access
      query.$or = [
        { 'accessControl.type': 'public' },
        { 'accessControl.allowedRoles': 'employee' },
        { 'accessControl.allowedUsers': req.user.id },
        { 'accessControl.allowedDepartments': req.user.department }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const files = await File.find(query)
      .populate('uploadedBy', 'name email role')
      .populate('folder', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await File.countDocuments(query);

    // Get categories for filtering
    const categories = await File.distinct('category');

    res.json({
      success: true,
      data: files,
      categories,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single file
// @route   GET /api/files/:id
// @access  Private
exports.getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'name email role')
      .populate('folder', 'name')
      .populate('previousVersions.uploadedBy', 'name email')
      .populate('activityLog.user', 'name email');

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check access
    if (!file.canUserAccess(req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Log view
    file.viewCount += 1;
    await file.logActivity(req.user.id, 'view', req);
    await file.save();

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download file
// @route   GET /api/files/:id/download
// @access  Private
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check access
    if (!file.canUserAccess(req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if download is allowed
    if (!file.accessControl.allowDownload) {
      return res.status(403).json({ message: 'Download not allowed for this file' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Update download stats
    file.downloadCount += 1;
    file.lastDownloadedAt = new Date();
    file.lastDownloadedBy = req.user.id;
    await file.logActivity(req.user.id, 'download', req);
    await file.save();

    // Send file
    res.download(file.path, file.originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update file metadata
// @route   PUT /api/files/:id
// @access  Private (Admin/Manager/Owner)
exports.updateFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && 
        file.uploadedBy.toString() !== req.user.id &&
        (req.user.role === 'manager' && file.department !== req.user.department)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatableFields = [
      'description', 'category', 'tags', 
      'accessControl', 'isArchived'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        file[field] = req.body[field];
      }
    });

    await file.logActivity(req.user.id, 'update', req);
    await file.save();

    res.json({
      success: true,
      message: 'File updated successfully',
      data: file
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete file (soft delete)
// @route   DELETE /api/files/:id
// @access  Private (Admin/Manager/Owner)
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && 
        file.uploadedBy.toString() !== req.user.id &&
        (req.user.role === 'manager' && file.department !== req.user.department)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Soft delete
    file.isActive = false;
    await file.logActivity(req.user.id, 'delete', req);
    await file.save();

    // Optionally delete physical file
    // if (fs.existsSync(file.path)) {
    //   fs.unlinkSync(file.path);
    // }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload new version
// @route   POST /api/files/:id/version
// @access  Private (Admin/Manager/Owner)
exports.uploadNewVersion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = await File.findById(req.params.id);
    const { changes } = req.body;

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && 
        file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Save current version to history
    file.previousVersions.push({
      filename: file.filename,
      url: file.url,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.updatedAt,
      version: file.version,
      changes
    });

    // Update with new version
    file.version += 1;
    file.filename = req.file.filename;
    file.path = req.file.path;
    file.url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    file.fileSize = req.file.size;
    file.updatedBy = req.user.id;

    await file.logActivity(req.user.id, 'update', req);
    await file.save();

    res.json({
      success: true,
      message: 'New version uploaded',
      data: file
    });
  } catch (error) {
    console.error('Error uploading version:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get file statistics
// @route   GET /api/files/stats
// @access  Private/Admin
exports.getFileStats = async (req, res) => {
  try {
    const stats = await File.aggregate([
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          byCategory: {
            $push: {
              category: '$category',
              size: '$fileSize'
            }
          },
          totalDownloads: { $sum: '$downloadCount' },
          totalViews: { $sum: '$viewCount' }
        }
      }
    ]);

    // Get recent uploads
    const recent = await File.find()
      .sort('-createdAt')
      .limit(5)
      .populate('uploadedBy', 'name')
      .select('originalName fileSize createdAt downloadCount');

    // Get popular files
    const popular = await File.find()
      .sort('-downloadCount')
      .limit(5)
      .populate('uploadedBy', 'name')
      .select('originalName downloadCount viewCount');

    res.json({
      success: true,
      data: {
        summary: stats[0] || { totalFiles: 0, totalSize: 0, totalDownloads: 0, totalViews: 0 },
        recent,
        popular
      }
    });
  } catch (error) {
    console.error('Error fetching file stats:', error);
    res.status(500).json({ message: error.message });
  }
};