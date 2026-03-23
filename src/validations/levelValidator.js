const Joi = require("joi");

const levelValidator = Joi.object({
  learning: Joi.string().required(), // Learning ObjectId
  levelNumber: Joi.number().min(1).max(5).required(),
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  difficulty: Joi.string()
    .valid("beginner", "elementary", "intermediate", "advanced", "master")
    .required(),
  unlockCondition: Joi.object({
    minScore: Joi.number().min(0).max(100).default(70),
    requiredLessonsCompleted: Joi.number().min(0).default(0),
  }).optional(),
  lessons: Joi.array().items(Joi.string()).optional(), // lesson ObjectIds
  order: Joi.number().required(),
  aiConfig: Joi.object({
    focusAreas: Joi.array()
      .items(
        Joi.string().valid(
          "vocabulary",
          "grammar",
          "conversation",
          "listening",
        ),
      )
      .optional(),
    complexityBoost: Joi.number().min(1).default(1),
  }).optional(),
  isActive: Joi.boolean().default(true),
});

module.exports = levelValidator;
