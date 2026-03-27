// validations/chatValidations.js
const Joi = require("joi");

exports.sendMessageSchema = Joi.object({
  languageId: Joi.string().optional(),
  message: Joi.string().min(1).max(1000).required(),
});

exports.updateMemorySchema = Joi.object({
  aiMemorySummary: Joi.string().min(3).max(1000).required(),
});