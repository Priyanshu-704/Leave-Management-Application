const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  // Company Information
  company: {
    name: {
      type: String,
      default: 'My Company'
    },
    logo: String,
    favicon: String,
    address: String,
    phone: String,
    email: String,
    website: String,
    taxId: String,
    registrationNumber: String
  },

  // Leave Settings
  leaveSettings: {
    defaultAnnualQuota: {
      type: Number,
      default: 20
    },
    defaultSickQuota: {
      type: Number,
      default: 10
    },
    defaultPersonalQuota: {
      type: Number,
      default: 5
    },
    maxConsecutiveLeaveDays: {
      type: Number,
      default: 30
    },
    minDaysBeforeRequest: {
      type: Number,
      default: 1
    },
    allowHalfDay: {
      type: Boolean,
      default: true
    },
    carryForwardLeaves: {
      type: Boolean,
      default: false
    },
    maxCarryForwardDays: {
      type: Number,
      default: 5
    },
    leaveAccrualRate: {
      type: Number,
      default: 1.5, // days per month
      min: 0
    },
    probationPeriod: {
      type: Number,
      default: 6, // months
      min: 0
    },
    noticePeriodForLeave: {
      type: Number,
      default: 3, // days
      min: 0
    }
  },

  // Attendance Settings
  attendanceSettings: {
    workStartTime: {
      type: String,
      default: '09:00'
    },
    workEndTime: {
      type: String,
      default: '18:00'
    },
    gracePeriodMinutes: {
      type: Number,
      default: 15
    },
    latePenaltyAfter: {
      type: Number,
      default: 30 // minutes
    },
    halfDayThreshold: {
      type: Number,
      default: 4 // hours
    },
    requireLocation: {
      type: Boolean,
      default: false
    },
    allowGeoFencing: {
      type: Boolean,
      default: false
    },
    geoFenceRadius: {
      type: Number,
      default: 100 // meters
    },
    officeLocation: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    workWeekDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }],
    weekendDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['saturday', 'sunday']
    }],
    holidays: [{
      name: String,
      date: Date,
      recurring: {
        type: Boolean,
        default: false
      },
      optional: {
        type: Boolean,
        default: false
      }
    }]
  },

  // Notification Settings
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    leaveRequestAlerts: {
      type: Boolean,
      default: true
    },
    leaveApprovalAlerts: {
      type: Boolean,
      default: true
    },
    attendanceReminders: {
      type: Boolean,
      default: true
    },
    announcementAlerts: {
      type: Boolean,
      default: true
    },
    dailyDigest: {
      type: Boolean,
      default: false
    },
    reminderTiming: {
      type: String,
      default: '08:00' // 8 AM
    },
    notifyManagersOnLeave: {
      type: Boolean,
      default: true
    },
    notifyHROnNewJoinee: {
      type: Boolean,
      default: true
    }
  },

  // Security Settings
  securitySettings: {
    passwordMinLength: {
      type: Number,
      default: 6
    },
    passwordRequireUppercase: {
      type: Boolean,
      default: true
    },
    passwordRequireLowercase: {
      type: Boolean,
      default: true
    },
    passwordRequireNumbers: {
      type: Boolean,
      default: true
    },
    passwordRequireSpecialChars: {
      type: Boolean,
      default: false
    },
    passwordExpiryDays: {
      type: Number,
      default: 90
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    sessionTimeout: {
      type: Number,
      default: 30 // minutes
    },
    twoFactorAuth: {
      type: Boolean,
      default: false
    },
    ipWhitelist: [String],
    allowMultipleSessions: {
      type: Boolean,
      default: true
    }
  },

  // Email Settings
  emailSettings: {
    smtpHost: String,
    smtpPort: Number,
    smtpSecure: {
      type: Boolean,
      default: false
    },
    smtpUser: String,
    smtpPassword: String,
    fromEmail: String,
    fromName: String,
    replyTo: String,
    emailSignature: String
  },

  // Theme Settings
  themeSettings: {
    primaryColor: {
      type: String,
      default: '#2563eb'
    },
    secondaryColor: {
      type: String,
      default: '#4f46e5'
    },
    colorScheme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    logoLight: String,
    logoDark: String,
    favicon: String,
    loginBackground: String,
    customCSS: String
  },

  // Feature Toggles
  featureToggles: {
    enableLeaveModule: {
      type: Boolean,
      default: true
    },
    enableAttendanceModule: {
      type: Boolean,
      default: true
    },
    enableAnnouncements: {
      type: Boolean,
      default: true
    },
    enableFileManagement: {
      type: Boolean,
      default: true
    },
    enableDepartmentStructure: {
      type: Boolean,
      default: true
    },
    enableOrganizationChart: {
      type: Boolean,
      default: true
    },
    enableReports: {
      type: Boolean,
      default: true
    },
    enableAnalytics: {
      type: Boolean,
      default: true
    },
    enableApiAccess: {
      type: Boolean,
      default: false
    }
  },

  // Integration Settings
  integrationSettings: {
    slack: {
      enabled: Boolean,
      webhookUrl: String,
      channel: String
    },
    microsoftTeams: {
      enabled: Boolean,
      webhookUrl: String
    },
    googleCalendar: {
      enabled: Boolean,
      clientId: String,
      clientSecret: String
    },
    outlook: {
      enabled: Boolean,
      clientId: String,
      clientSecret: String
    }
  },

  // Backup Settings
  backupSettings: {
    autoBackup: {
      type: Boolean,
      default: false
    },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    backupTime: {
      type: String,
      default: '02:00'
    },
    backupRetention: {
      type: Number,
      default: 30 // days
    },
    backupLocation: String
  },

  // Audit Log
  auditLog: [{
    action: String,
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    ip: String,
    userAgent: String
  }],

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Method to update settings with audit log
settingSchema.methods.updateWithAudit = async function(updates, userId, req) {
  const changes = [];
  
  Object.keys(updates).forEach(section => {
    if (typeof updates[section] === 'object' && updates[section] !== null) {
      Object.keys(updates[section]).forEach(field => {
        const oldValue = this[section]?.[field];
        const newValue = updates[section][field];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            action: 'update',
            field: `${section}.${field}`,
            oldValue,
            newValue,
            changedBy: userId,
            ip: req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
            userAgent: req?.headers?.['user-agent'] || 'unknown'
          });
          
          // Update the value
          if (!this[section]) this[section] = {};
          this[section][field] = newValue;
        }
      });
    }
  });

  if (changes.length > 0) {
    this.auditLog.push(...changes);
    this.version += 1;
    this.updatedBy = userId;
    await this.save();
  }

  return changes;
};

module.exports = mongoose.model('Setting', settingSchema);
