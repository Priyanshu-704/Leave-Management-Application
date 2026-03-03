const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  employeeCount: {
    type: Number,
    default: 0
  },
  budget: {
    type: Number,
    default: 0
  },
  location: {
    building: String,
    floor: String,
    office: String
  },
  contactInfo: {
    phone: String,
    email: String,
    extension: String
  },
  settings: {
    defaultLeaveQuota: {
      annual: { type: Number, default: 20 },
      sick: { type: Number, default: 10 },
      personal: { type: Number, default: 5 }
    },
    requiresApproval: { type: Boolean, default: true },
    approvalChain: [{
      role: { type: String, enum: ['manager', 'admin'] },
      order: Number
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
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

// Virtual for getting employees in this department
departmentSchema.virtual('employees', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department'
});

// Method to update employee count
departmentSchema.methods.updateEmployeeCount = async function() {
  const count = await mongoose.model('User').countDocuments({ 
    department: this.name,
    isActive: true 
  });
  this.employeeCount = count;
  await this.save();
  return count;
};

// Static method to get department statistics
departmentSchema.statics.getDepartmentStats = async function() {
  const stats = await this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'name',
        foreignField: 'department',
        as: 'employees'
      }
    },
    {
      $project: {
        name: 1,
        code: 1,
        employeeCount: { $size: '$employees' },
        activeEmployees: {
          $size: {
            $filter: {
              input: '$employees',
              as: 'emp',
              cond: '$$emp.isActive'
            }
          }
        },
        managers: {
          $size: {
            $filter: {
              input: '$employees',
              as: 'emp',
              cond: { $eq: ['$$emp.role', 'manager'] }
            }
          }
        }
      }
    }
  ]);
  return stats;
};

module.exports = mongoose.model('Department', departmentSchema);