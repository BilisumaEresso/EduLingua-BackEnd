const Joi = require("joi");

// Individual question validation
const quizQuestionValidator = Joi.object({
  section: Joi.string().required(),
  questionText: Joi.string().min(3).max(300).required(),
  questionType: Joi.string()
    .valid("multiple_choice", "text_input", "voice_match")
    .default("multiple_choice"),
  options: Joi.array().items(Joi.string()).optional(),
  correctAnswer: Joi.string().required(),
  explanation: Joi.string().optional(),
  difficulty: Joi.string().valid("easy", "medium", "hard").default("easy"),
  skills: Joi.array()
    .items(
      Joi.string().valid("vocabulary", "grammar", "conversation", "listening"),
    )
    .optional(),
  isAiGenerated: Joi.boolean().default(true),
});

// Quiz validation
const quizValidator = Joi.object({
  lesson: Joi.string().required(),
  title: Joi.string().min(3).max(100).default("Lesson Review"),
  passingScore: Joi.number().min(0).max(100).default(80),
  questionPool: Joi.array().items(quizQuestionValidator).min(1).required(),
});

module.exports = quizValidator;
