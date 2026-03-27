const Joi = require("joi");

const lessonValidator = Joi.object({
  level: Joi.string().required(), // Level ObjectId
  teacher: Joi.string().required(), // User ObjectId
  order: Joi.number().optional(),
  title: Joi.string().min(3).max(80).required(),
  description: Joi.string().min(3).max(300).required(),
  objective: Joi.string().min(3).max(500).required(),
  aiContext: Joi.object({
    topic: Joi.string().required(),
    teacherPrompt: Joi.string().optional(),
    difficulty: Joi.string().valid("easy", "medium", "hard").default("easy"),
    generated: Joi.boolean().default(false),
  }).optional(),
  sections: Joi.array().items(Joi.string()).optional(),
  resources: Joi.array().items(Joi.string()).optional(),
  quizPool: Joi.string().optional(),
  stats: Joi.object({
    totalQuestions: Joi.number().min(0).optional(),
    avgScore: Joi.number().min(0).max(100).optional(),
    attempts: Joi.number().min(0).optional(),
  }).optional(),
  isActive: Joi.boolean().default(false),
});

module.exports = lessonValidator;
