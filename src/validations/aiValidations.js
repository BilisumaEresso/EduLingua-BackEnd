// validations/aiValidations.js
const Joi = require("joi");

const generateSectionSchema = Joi.object({
  lessonId: Joi.string().required(),
  retries: Joi.number().min(1).max(5).default(2),
});

const generateQuizSchema = Joi.object({
  lessonId: Joi.string().required(),
  retries: Joi.number().min(1).max(5).default(2),
});

const chatSchema = Joi.object({
  lessonId: Joi.string().required(),
  messages: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid("user", "assistant").required(),
        content: Joi.string().required(),
      }),
    )
    .min(1)
    .required(),
});

module.exports = {
  generateSectionSchema,
  generateQuizSchema,
  chatSchema,
};
