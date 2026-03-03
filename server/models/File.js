const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileExtension: String,
  url: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'document', 
      'policy', 
      'form', 
      'report', 
      'training', 
      'employee-document',
      'contract',
      'invoice',
      'other'
    ],
    default: 'document'
  },
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  
  // Sharing permissions
  accessControl: {
    type: {
      type: String,
      enum: ['public', 'private', 'restricted'],
      default: 'restricted'
    },
    allowedRoles: [{
      type: String,
      enum: ['admin', 'manager', 'employee']
    }],
    allowedDepartments: [{
      type: String,
      ref: 'Department'
    }],
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    allowDownload: {
      type: Boolean,
      default: true
    },
    password: String, // Optional password protection
    expiryDate: Date // File expiry
  },

  // Version control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    filename: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    version: Number,
    changes: String
  }],

  // Metadata
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByRole: {
    type: String,
    enum: ['admin', 'manager', 'employee']
  },
  department: String, // Department context (for manager uploads)

  // Statistics
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: Date,
  lastDownloadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Activity log
  activityLog: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['upload', 'download', 'view', 'update', 'delete', 'share']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ip: String,
    userAgent: String
  }],

  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  
  thumbnail: String, // For images/previews
  
  // Relationships
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder'
  },
  relatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedToModel'
  },
  relatedToModel: {
    type: String,
    enum: ['User', 'Leave', 'Announcement', null]
  }
}, {
  timestamps: true
});

// Indexes for better performance
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ category: 1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ 'accessControl.allowedUsers': 1 });
fileSchema.index({ 'accessControl.allowedDepartments': 1 });
fileSchema.index({ department: 1 });

// Method to check if user can access file
fileSchema.methods.canUserAccess = function(user) {
  // Admin can access everything
  if (user.role === 'admin') return true;
  
  // Public files
  if (this.accessControl.type === 'public') return true;
  
  // Check expiry
  if (this.accessControl.expiryDate && new Date() > this.accessControl.expiryDate) {
    return false;
  }
  
  // Check allowed roles
  if (this.accessControl.allowedRoles?.includes(user.role)) return true;
  
  // Check allowed departments
  if (this.accessControl.allowedDepartments?.includes(user.department)) return true;
  
  // Check allowed users
  if (this.accessControl.allowedUsers?.some(id => id.toString() === user._id.toString())) return true;
  
  // Uploader can access
  if (this.uploadedBy.toString() === user._id.toString()) return true;
  
  // Manager can access files from their department
  if (user.role === 'manager' && this.department === user.department) return true;
  
  return false;
};

// Method to log activity
fileSchema.methods.logActivity = function(userId, action, req) {
  this.activityLog.push({
    user: userId,
    action,
    timestamp: new Date(),
    ip: req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
    userAgent: req?.headers?.['user-agent'] || 'unknown'
  });
};

module.exports = mongoose.model('File', fileSchema);