const Joi = require("joi");

const quizQuestionValidator = Joi.object({
  section: Joi.string().optional().allow(null, ""), // Fixed: Optional for AI content
  questionText: Joi.string().min(3).max(500).required(),
  questionType: Joi.string()
    .valid("multiple_choice", "text_input", "voice_match")
    .default("multiple_choice"),

  // Fixed: Condition-based validation for options
  options: Joi.when("questionType", {
    is: "multiple_choice",
    then: Joi.array().items(Joi.string()).min(2).required(),
    otherwise: Joi.array().items(Joi.string()).optional(),
  }),

  correctAnswer: Joi.string().required(),
  explanation: Joi.string().optional().allow(""),
  difficulty: Joi.string().valid("easy", "medium", "hard").default("easy"),
  skills: Joi.array().items(Joi.string()).default(["vocabulary"]),
  isAiGenerated: Joi.boolean().default(true),
  // Allow internal MongoDB fields
  _id: Joi.any().optional(),
  createdAt: Joi.any().optional(),
  updatedAt: Joi.any().optional(),
  __v: Joi.any().optional(),
});

const quizValidator = Joi.object({
  // Fixed: Support both naming conventions and lesson-based saving
  levelId: Joi.string().optional(),
  level: Joi.string().optional(),
  lessonId: Joi.string().optional(),

  title: Joi.string().min(3).max(100).default("Level Review"),
  passingScore: Joi.number().min(0).max(100).default(80),

  // Fixed: Support both keys
  questions: Joi.array().items(quizQuestionValidator).min(1).optional(),
  questionPool: Joi.array().items(quizQuestionValidator).min(1).optional(),

  // Allow internal MongoDB fields
  _id: Joi.any().optional(),
  createdAt: Joi.any().optional(),
  updatedAt: Joi.any().optional(),
  __v: Joi.any().optional(),
}).xor("levelId", "level", "lessonId"); // Fixed: Require exactly one of these

module.exports = quizValidator;
