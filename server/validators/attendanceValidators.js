const Joi = require("joi");

const locationSchema = Joi.object({
  coordinates: Joi.array().items(Joi.number()).length(2).optional(),
  address: Joi.string().allow("").optional(),
}).optional();

exports.checkInSchema = Joi.object({
  body: Joi.object({
    location: locationSchema,
    note: Joi.string().max(500).optional(),
    photo: Joi.string().optional(),
  }).required(),
  params: Joi.object({}).unknown(true),
  query: Joi.object({}).unknown(true),
});

exports.checkOutSchema = Joi.object({
  body: Joi.object({
    location: locationSchema,
    note: Joi.string().max(500).optional(),
    photo: Joi.string().optional(),
  }).required(),
  params: Joi.object({}).unknown(true),
  query: Joi.object({}).unknown(true),
});
