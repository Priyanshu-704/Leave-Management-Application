const mongoose = require('mongoose');

const shiftAssignmentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  isPermanent: {
    type: Boolean,
    default: false
  },
  rotationGroup: String,
  
  // For swap requests
  swapRequest: {
    isRequested: {
      type: Boolean,
      default: false
    },
    requestedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedShift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift'
    },
    requestedDate: Date,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    comments: String
  },

  // Overtime tracking
  overtime: [{
    date: Date,
    hours: Number,
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }],

  // Attendance records for this shift
  attendance: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance'
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure one active assignment per employee
shiftAssignmentSchema.index({ employee: 1, startDate: -1 });

module.exports = mongoose.model('ShiftAssignment', shiftAssignmentSchema);