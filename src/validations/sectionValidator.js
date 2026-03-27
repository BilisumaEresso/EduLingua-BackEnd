const Joi = require("joi");

// Content block validation
const contentBlockValidator = Joi.object({
  type: Joi.string()
    .valid(
      "translation",
      "explanation",
      "example",
      "exercise",
      "pronunciation",
      "hint",
    )
    .required(),
  payload: Joi.object({
    text: Joi.string().optional(),
    translations: Joi.object({
      source: Joi.string().optional(),
      target: Joi.string().optional(),
      alternatives: Joi.array().items(Joi.string()).optional(),
    }).optional(),
    examples: Joi.array()
      .items(
        Joi.object({
          source: Joi.string().required(),
          target: Joi.string().required(),
        }),
      )
      .optional(),
    question: Joi.string().optional(),
    answer: Joi.string().optional(),
    hint: Joi.string().optional(),
  }).optional(),
  isAiGenerated: Joi.boolean().default(true),
});

// Section validation
const sectionValidator = Joi.object({
  lesson: Joi.string().required(),
  title: Joi.string().min(2).max(100).required(),
  order: Joi.number().optional(),
  objective: Joi.string().min(3).max(300).required(),
  contentBlocks: Joi.array().items(contentBlockValidator).optional(),
  skills: Joi.array()
    .items(
      Joi.string().valid("vocabulary", "grammar", "conversation", "listening"),
    )
    .optional(),
  aiMeta: Joi.object({
    promptSnapshot: Joi.string().optional(),
    difficulty: Joi.string().optional(),
  }).optional(),
});
const bulkSectionSchema = Joi.object({
  lessonId: Joi.string().required(),
  sections: Joi.array()
    .items(
      Joi.object({
        order: Joi.number().optional(),
        title: Joi.string().required(),
        objective: Joi.string().required(),
        contentBlocks: Joi.array().required(),
        skills: Joi.array().items(Joi.string()),
        difficulty: Joi.string().valid("easy", "medium", "hard"),
      }),
    )
    .min(1)
    .required(),
});

module.exports = {sectionValidator,bulkSectionSchema};
