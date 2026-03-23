const Joi = require("joi");

// Joi validation schema for Language
const languageValidator = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  nativeName: Joi.string().trim().min(1).max(100).required(),
  code: Joi.string().trim().lowercase().min(2).max(10).required(),
  direction: Joi.string().valid("ltr", "rtl").default("ltr"),
  isActive: Joi.boolean().default(true),
  metadata: Joi.object({
    flag: Joi.string().optional(),
    region: Joi.string().optional(),
  }).optional(),
});

module.exports = languageValidator;
