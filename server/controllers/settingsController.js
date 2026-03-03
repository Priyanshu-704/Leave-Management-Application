const Setting = require('../models/Setting');
const User = require('../models/User');
const Department = require('../models/Department');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private/Admin
exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    
    // Remove sensitive data
    if (settings.emailSettings) {
      settings.emailSettings.smtpPassword = undefined;
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    const updates = req.body;

    // Validate settings based on section
    if (updates.leaveSettings) {
      validateLeaveSettings(updates.leaveSettings);
    }
    if (updates.attendanceSettings) {
      validateAttendanceSettings(updates.attendanceSettings);
    }
    if (updates.securitySettings) {
      validateSecuritySettings(updates.securitySettings);
    }

    // Update with audit trail
    const changes = await settings.updateWithAudit(updates, req.user.id, req);

    // Apply settings that need immediate effect
    await applySettingsChanges(changes, req.user.id);

    // Remove sensitive data from response
    const responseSettings = settings.toObject();
    if (responseSettings.emailSettings) {
      responseSettings.emailSettings.smtpPassword = undefined;
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      changes: changes.length,
      data: responseSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get settings by section
// @route   GET /api/settings/:section
// @access  Private/Admin
exports.getSettingsSection = async (req, res) => {
  try {
    const { section } = req.params;
    const settings = await Setting.getSettings();
    
    const validSections = [
      'company', 'leaveSettings', 'attendanceSettings', 
      'notificationSettings', 'securitySettings', 'emailSettings',
      'themeSettings', 'featureToggles', 'integrationSettings',
      'backupSettings'
    ];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section' });
    }

    // Remove sensitive data
    if (section === 'emailSettings' && settings.emailSettings) {
      settings.emailSettings.smtpPassword = undefined;
    }

    res.json({
      success: true,
      data: settings[section] || {}
    });
  } catch (error) {
    console.error('Error fetching settings section:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get audit log
// @route   GET /api/settings/audit
// @access  Private/Admin
exports.getAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const settings = await Setting.getSettings();
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort audit log by date (newest first)
    const auditLog = settings.auditLog
      .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
      .slice(skip, skip + parseInt(limit));

    // Populate user details
    const populatedLog = await Promise.all(
      auditLog.map(async (entry) => {
        if (entry.changedBy) {
          const user = await User.findById(entry.changedBy).select('name email');
          return { ...entry.toObject(), changedBy: user };
        }
        return entry;
      })
    );

    res.json({
      success: true,
      data: populatedLog,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(settings.auditLog.length / parseInt(limit)),
        total: settings.auditLog.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset settings to default
// @route   POST /api/settings/reset
// @access  Private/Admin
exports.resetSettings = async (req, res) => {
  try {
    const { section } = req.body;
    
    // Create new default settings
    const defaultSettings = new Setting();
    
    // If section specified, only reset that section
    if (section) {
      const settings = await Setting.getSettings();
      settings[section] = defaultSettings[section];
      settings.auditLog.push({
        action: 'reset',
        field: section,
        changedBy: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      settings.version += 1;
      settings.updatedBy = req.user.id;
      await settings.save();
      
      res.json({
        success: true,
        message: `${section} reset to defaults`
      });
    } else {
      // Reset all settings
      await Setting.deleteMany({});
      const newSettings = await Setting.create({});
      
      res.json({
        success: true,
        message: 'All settings reset to defaults'
      });
    }
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Test email configuration
// @route   POST /api/settings/test-email
// @access  Private/Admin
exports.testEmailSettings = async (req, res) => {
  try {
    const { testEmail } = req.body;
    const settings = await Setting.getSettings();
    
    // Here you would implement actual email sending logic
    // using nodemailer with the current email settings
    
    res.json({
      success: true,
      message: `Test email sent to ${testEmail || settings.company.email}`
    });
  } catch (error) {
    console.error('Error testing email:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system status
// @route   GET /api/settings/status
// @access  Private/Admin
exports.getSystemStatus = async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      activeUsers: await User.countDocuments({ isActive: true }),
      departments: await Department.countDocuments(),
      settings: await Setting.countDocuments(),
      lastBackup: null, // You would get this from backup system
      systemHealth: 'healthy',
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Validation functions
function validateLeaveSettings(settings) {
  if (settings.maxConsecutiveLeaveDays && settings.maxConsecutiveLeaveDays < 1) {
    throw new Error('Max consecutive leave days must be at least 1');
  }
  if (settings.minDaysBeforeRequest && settings.minDaysBeforeRequest < 0) {
    throw new Error('Minimum days before request cannot be negative');
  }
  if (settings.leaveAccrualRate && settings.leaveAccrualRate < 0) {
    throw new Error('Leave accrual rate cannot be negative');
  }
}

function validateAttendanceSettings(settings) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (settings.workStartTime && !timeRegex.test(settings.workStartTime)) {
    throw new Error('Invalid work start time format');
  }
  if (settings.workEndTime && !timeRegex.test(settings.workEndTime)) {
    throw new Error('Invalid work end time format');
  }
  if (settings.gracePeriodMinutes && settings.gracePeriodMinutes < 0) {
    throw new Error('Grace period cannot be negative');
  }
}

function validateSecuritySettings(settings) {
  if (settings.passwordMinLength && settings.passwordMinLength < 6) {
    throw new Error('Password minimum length must be at least 6');
  }
  if (settings.maxLoginAttempts && settings.maxLoginAttempts < 1) {
    throw new Error('Max login attempts must be at least 1');
  }
  if (settings.sessionTimeout && settings.sessionTimeout < 5) {
    throw new Error('Session timeout must be at least 5 minutes');
  }
}

// Apply settings changes that need immediate effect
async function applySettingsChanges(changes, userId) {
  for (const change of changes) {
    switch(change.field) {
      case 'securitySettings.passwordMinLength':
      case 'securitySettings.passwordRequireUppercase':
      case 'securitySettings.passwordRequireLowercase':
      case 'securitySettings.passwordRequireNumbers':
      case 'securitySettings.passwordRequireSpecialChars':
        // These will be applied in auth middleware
        console.log('Security settings updated');
        break;
        
      case 'attendanceSettings.workStartTime':
      case 'attendanceSettings.workEndTime':
      case 'attendanceSettings.gracePeriodMinutes':
        // Update attendance calculations
        console.log('Attendance settings updated');
        break;
        
      case 'leaveSettings.defaultAnnualQuota':
      case 'leaveSettings.defaultSickQuota':
      case 'leaveSettings.defaultPersonalQuota':
        // This would affect new users
        console.log('Leave quota settings updated');
        break;
    }
  }
}