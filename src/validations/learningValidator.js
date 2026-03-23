const Joi = require("joi");

// Create / Update Learning Track
const learningSchema = Joi.object({
  sourceLanguage: Joi.string().required(), // ObjectId
  targetLanguage: Joi.string().required(), // ObjectId
  title: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().trim().min(5).max(1000).required(),
  levels: Joi.array()
    .items(
      Joi.object({
        levelNumber: Joi.number().min(1).max(5).required(),
        lessons: Joi.array().items(Joi.string()), // array of lesson ObjectIds
      }),
    )
    .optional(),
  aiConfig: Joi.object({
    basePrompt: Joi.string().optional(),
    difficultyCurve: Joi.string().valid("linear", "adaptive").default("linear"),
  }).optional(),
  isActive: Joi.boolean().default(true),
});

module.exports = learningSchema;
