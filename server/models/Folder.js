const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder'
  },
  department: String, // Department-specific folders
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessControl: {
    allowedRoles: [{
      type: String,
      enum: ['admin', 'manager', 'employee']
    }],
    allowedDepartments: [String],
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for getting files in folder
folderSchema.virtual('files', {
  ref: 'File',
  localField: '_id',
  foreignField: 'folder'
});

module.exports = mongoose.model('Folder', folderSchema);