const express = require("express");
const Joi = require("joi");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/joiValidation");
const { contactAdministrator } = require("../controllers/supportController");

const router = express.Router();

const contactAdminSchema = Joi.object({
  body: Joi.object({
    subject: Joi.string().trim().min(3).max(120).required(),
    message: Joi.string().trim().min(10).max(2000).required(),
    priority: Joi.string().valid("low", "normal", "high").optional(),
  }).required(),
  params: Joi.object({}).unknown(true),
  query: Joi.object({}).unknown(true),
});

router.use(protect);
router.post("/contact-admin", validate(contactAdminSchema), contactAdministrator);

module.exports = router;
