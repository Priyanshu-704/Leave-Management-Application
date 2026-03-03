const { body } = require('express-validator');

exports.validateUser = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .if(body('password').exists())
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('employeeId')
    .notEmpty().withMessage('Employee ID is required')
    .trim(),
  
  body('department')
    .notEmpty().withMessage('Department is required'),
  
  body('role')
    .optional()
    .isIn(['employee', 'manager', 'admin']).withMessage('Invalid role')
];

exports.validateLeaveBalance = [
  body('annual')
    .optional()
    .isInt({ min: 0 }).withMessage('Annual leave must be a positive number'),
  
  body('sick')
    .optional()
    .isInt({ min: 0 }).withMessage('Sick leave must be a positive number'),
  
  body('personal')
    .optional()
    .isInt({ min: 0 }).withMessage('Personal leave must be a positive number')
];

exports.validatePasswordChange = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];