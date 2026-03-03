const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Department = require('../models/Department');

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Admin/Manager)
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      priority,
      targetDepartments,
      targetRoles,
      attachments,
      expiryDate,
      pinned
    } = req.body;

    // Validate permissions
    if (req.user.role === 'manager' && targetRoles?.includes('admin')) {
      return res.status(403).json({
        message: 'Managers cannot target admin role'
      });
    }

    // For managers, restrict to their department
    let finalTargetDepartments = targetDepartments;
    if (req.user.role === 'manager') {
      if (!targetDepartments || targetDepartments.length === 0) {
        // If no departments specified, default to manager's department
        finalTargetDepartments = [req.user.department];
      } else {
        // Verify manager only targets their own department
        const invalidDepts = targetDepartments.filter(d => d !== req.user.department);
        if (invalidDepts.length > 0) {
          return res.status(403).json({
            message: 'Managers can only post to their own department'
          });
        }
      }
    }

    const announcement = await Announcement.create({
      title,
      content,
      type: type || 'general',
      priority: priority || 'medium',
      targetDepartments: finalTargetDepartments || [],
      targetRoles: targetRoles || ['all'],
      attachments: attachments || [],
      expiryDate: expiryDate || new Date(+new Date() + 30*24*60*60*1000),
      pinned: pinned || false,
      createdBy: req.user.id,
      createdByRole: req.user.role
    });

    // Populate creator info
    await announcement.populate('createdBy', 'name email role');

    // Notify relevant users (you can implement socket.io here)
    // notifyUsers(announcement);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get announcements for current user
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      department,
      showExpired = false,
      pinned = false
    } = req.query;

    // Build query based on user role and department
    let query = { isActive: true };

    // Filter by expiry
    if (!showExpired) {
      query.expiryDate = { $gte: new Date() };
    }

    // Filter by type
    if (type && type !== 'all') {
      query.type = type;
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Filter by pinned
    if (pinned === 'true') {
      query.pinned = true;
    }

    // Role-based filtering
    if (req.user.role === 'admin') {
      // Admin sees everything
    } else if (req.user.role === 'manager') {
      // Managers see:
      // - Global announcements (targetRoles includes 'all' or 'manager')
      // - Their department announcements
      // - Announcements they created
      query.$or = [
        { targetRoles: { $in: ['all', 'manager'] } },
        { targetDepartments: req.user.department },
        { createdBy: req.user.id }
      ];
    } else {
      // Employees see:
      // - Global announcements (targetRoles includes 'all' or 'employee')
      // - Their department announcements
      query.$or = [
        { targetRoles: { $in: ['all', 'employee'] } },
        { targetDepartments: req.user.department }
      ];
    }

    // Department filter (for managers/admins)
    if (department && department !== 'all' && req.user.role !== 'employee') {
      query.targetDepartments = department;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email role department')
      .populate('readBy.user', 'name email')
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Announcement.countDocuments(query);

    // Mark as read for current user
    await Promise.all(announcements.map(async (ann) => {
      ann.markAsRead(req.user.id);
      await ann.save();
    }));

    // Get unread count
    const unreadCount = await Announcement.countDocuments({
      ...query,
      'readBy.user': { $ne: req.user.id }
    });

    res.json({
      success: true,
      data: announcements,
      unreadCount,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name email role department')
      .populate('readBy.user', 'name email')
      .populate('acknowledgedBy.user', 'name email')
      .populate('comments.user', 'name email');

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user can view this announcement
    if (!announcement.canUserView(req.user)) {
      return res.status(403).json({ message: 'Not authorized to view this announcement' });
    }

    // Mark as read
    announcement.markAsRead(req.user.id);
    await announcement.save();

    res.json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Admin/Manager - only their own)
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && announcement.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this announcement' });
    }

    // Update fields
    const updatableFields = [
      'title', 'content', 'type', 'priority', 
      'targetDepartments', 'targetRoles', 'attachments',
      'expiryDate', 'pinned'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        announcement[field] = req.body[field];
      }
    });

    announcement.updatedBy = req.user.id;
    await announcement.save();

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin/Manager - only their own)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && announcement.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this announcement' });
    }

    // Soft delete
    announcement.isActive = false;
    await announcement.save();

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Acknowledge announcement
// @route   POST /api/announcements/:id/acknowledge
// @access  Private
exports.acknowledgeAnnouncement = async (req, res) => {
  try {
    const { comment } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if already acknowledged
    const alreadyAcknowledged = announcement.acknowledgedBy.some(
      a => a.user.toString() === req.user.id
    );

    if (!alreadyAcknowledged) {
      announcement.acknowledgedBy.push({
        user: req.user.id,
        acknowledgedAt: new Date(),
        comment
      });
      await announcement.save();
    }

    res.json({
      success: true,
      message: 'Announcement acknowledged'
    });
  } catch (error) {
    console.error('Error acknowledging announcement:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment to announcement
// @route   POST /api/announcements/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    announcement.comments.push({
      user: req.user.id,
      content,
      createdAt: new Date()
    });

    await announcement.save();

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get announcement statistics (Admin only)
// @route   GET /api/announcements/stats
// @access  Private/Admin
exports.getAnnouncementStats = async (req, res) => {
  try {
    const stats = await Announcement.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byType: {
            $push: {
              type: '$type',
              count: 1
            }
          },
          byPriority: {
            $push: {
              priority: '$priority',
              count: 1
            }
          },
          totalReads: { $sum: { $size: '$readBy' } },
          totalAcks: { $sum: { $size: '$acknowledgedBy' } }
        }
      },
      {
        $project: {
          total: 1,
          byType: {
            $reduce: {
              input: '$byType',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  { ['$$this.type']: { $sum: ['$$value.$$this.type', 1] } }
                ]
              }
            }
          },
          byPriority: {
            $reduce: {
              input: '$byPriority',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  { ['$$this.priority']: { $sum: ['$$value.$$this.priority', 1] } }
                ]
              }
            }
          },
          totalReads: 1,
          totalAcks: 1,
          avgReadsPerAnnouncement: { $divide: ['$totalReads', '$total'] }
        }
      }
    ]);

    // Get recent activity
    const recent = await Announcement.find()
      .sort('-createdAt')
      .limit(5)
      .select('title createdAt readBy acknowledgedBy');

    res.json({
      success: true,
      data: {
        summary: stats[0] || { total: 0 },
        recent
      }
    });
  } catch (error) {
    console.error('Error fetching announcement stats:', error);
    res.status(500).json({ message: error.message });
  }
};