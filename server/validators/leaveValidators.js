const Joi = require("joi");

exports.applyLeaveSchema = Joi.object({
  body: Joi.object({
    leaveType: Joi.string().valid("annual", "sick", "personal", "unpaid").required(),
    startDate: Joi.string().trim().min(1).required(),
    endDate: Joi.string().trim().min(1).required(),
    reason: Joi.string().trim().min(3).max(1000).required(),
  }).required(),
  params: Joi.object({}).unknown(true),
  query: Joi.object({}).unknown(true),
});

exports.updateLeaveStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid("pending", "approved", "rejected", "cancelled").required(),
    comments: Joi.string().max(1000).optional(),
  }).required(),
  params: Joi.object({ id: Joi.string().trim().min(1).required() }).required(),
  query: Joi.object({}).unknown(true),
});
