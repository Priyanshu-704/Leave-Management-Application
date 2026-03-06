const Joi = require("joi");

const designationEnum = [
  "intern",
  "staff",
  "senior",
  "lead",
  "manager",
  "project_manager",
  "hr",
  "finance",
  "it",
  "director",
];

exports.registerSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("employee", "manager", "admin", "super_admin").optional(),
    designation: Joi.string().valid(...designationEnum).optional(),
    department: Joi.string().trim().min(1).required(),
    employeeId: Joi.string().trim().min(1).required(),
    dateOfBirth: Joi.date().max("now").optional(),
    joiningDate: Joi.date().max("now").optional(),
  }).required(),
  params: Joi.object({}).unknown(true),
  query: Joi.object({}).unknown(true),
});

exports.loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(1).required(),
    takeoverExistingSession: Joi.boolean().optional(),
    twoFactorCode: Joi.string().trim().length(6).pattern(/^\d{6}$/).optional(),
  }).required(),
  params: Joi.object({}).unknown(true),
  query: Joi.object({}).unknown(true),
});

exports.forgotPasswordSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email().required(),
  }).required(),
  params: Joi.object({}).unknown(true),
  query: Joi.object({}).unknown(true),
});

exports.resetPasswordSchema = Joi.object({
  body: Joi.object({
    password: Joi.string().min(6).required(),
  }).required(),
  params: Joi.object({
    token: Joi.string().trim().min(1).required(),
  }).required(),
  query: Joi.object({}).unknown(true),
});
