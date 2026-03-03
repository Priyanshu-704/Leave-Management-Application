const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['general', 'department', 'urgent', 'event', 'holiday', 'other'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetDepartments: [{
    type: String,
    ref: 'Department'
  }],
  targetRoles: [{
    type: String,
    enum: ['all', 'admin', 'manager', 'employee']
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'manager', 'employee'],
    required: true
  },
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    size: Number
  }],
  expiryDate: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000) // Default 30 days
  },
  isActive: {
    type: Boolean,
    default: true
  },
  pinned: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  acknowledgedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    },
    comment: String
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ targetDepartments: 1 });
announcementSchema.index({ type: 1 });
announcementSchema.index({ priority: 1 });
announcementSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

// Virtual to check if announcement is expired
announcementSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

// Method to check if user can view this announcement
announcementSchema.methods.canUserView = function(user) {
  // Admin can view everything
  if (user.role === 'admin') return true;
  
  // If targetRoles includes 'all', everyone can view
  if (this.targetRoles.includes('all')) return true;
  
  // Check if user's role is in targetRoles
  if (this.targetRoles.includes(user.role)) return true;
  
  // Check if user's department is in targetDepartments
  if (this.targetDepartments.includes(user.department)) return true;
  
  // If created by manager and user is in same department
  if (this.createdByRole === 'manager' && this.targetDepartments.includes(user.department)) {
    return true;
  }
  
  return false;
};

// Method to mark as read
announcementSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(r => r.user.toString() === userId.toString())) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
};

module.exports = mongoose.model('Announcement', announcementSchema);