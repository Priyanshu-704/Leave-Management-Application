const Joi = require("joi");

exports.wfhCreateSchema = Joi.object({
  body: Joi.object({
    startDate: Joi.string().trim().min(1).required(),
    endDate: Joi.string().trim().min(1).required(),
    reason: Joi.string().trim().min(3).max(1000).required(),
  }).required(),
  params: Joi.object({}).unknown(true),
  query: Joi.object({}).unknown(true),
});

exports.wfhStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid("pending", "approved", "rejected", "cancelled").required(),
    comments: Joi.string().max(1000).optional(),
  }).required(),
  params: Joi.object({ id: Joi.string().trim().min(1).required() }).required(),
  query: Joi.object({}).unknown(true),
});

exports.salaryGenerateSchema = Joi.object({
  body: Joi.object({
    userId: Joi.string().trim().min(1).required(),
    month: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
    baseSalary: Joi.number().min(0).required(),
  }).required(),
  params: Joi.object({}).unknown(true),
  query: Joi.object({}).unknown(true),
});
