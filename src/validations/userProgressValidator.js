const Joi = require("joi");

// Start a learning track
const startLearningTrackSchema = Joi.object({
  learning: Joi.string().required(), // ObjectId of Learning track
});

// Mark a single lesson done or skipped (phase-aware)
const markLessonCompletedSchema = Joi.object({
  learningId: Joi.string().required(), // ObjectId of the Learning track
  levelId: Joi.string().required(), // ObjectId of the Level
  lessonId: Joi.string().required(), // ObjectId of the Lesson
  status: Joi.string().valid("done", "skipped").required(),
});

// Start quiz attempt for a level
const quizStartSchema = Joi.object({
  learningId: Joi.string().required(),
  levelId: Joi.string().required(),
  questionCount: Joi.number().integer().min(1).max(50).default(10),
});

// Submit quiz answers (score is computed server-side)
const quizSubmitSchema = Joi.object({
  learningId: Joi.string().required(),
  levelId: Joi.string().required(),
  attemptId: Joi.string().required(),
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().required(),
        answer: Joi.string().allow("").required(),
      }),
    )
    .required(),
  durationMs: Joi.number().min(0).optional(),
});

// Increment AI chat count
const incrementAIChatSchema = Joi.object({
  count: Joi.number().min(1).default(1),
});

// Mark level completed
const completeLevelSchema = Joi.object({
  levelId: Joi.string().required(),
  quizScore: Joi.number().min(0).max(100).required(),
  xpEarned: Joi.number().min(0).required(),
  lessonIds: Joi.array().items(Joi.string()).optional(),
});

// Delete progress
const deleteProgressSchema = Joi.object({
  learningId: Joi.string().required(),
});

module.exports = {
  startLearningTrackSchema,
  markLessonCompletedSchema,
  completeLevelSchema,
  quizStartSchema,
  quizSubmitSchema,
  incrementAIChatSchema,
  deleteProgressSchema,
};
