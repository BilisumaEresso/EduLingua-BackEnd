const Joi = require("joi");

// Start a learning track
const startLearningTrackSchema = Joi.object({
  learning: Joi.string().required(), // ObjectId of Learning track
});

// Mark lesson completed
const markLessonCompletedSchema = Joi.object({
  lessonId: Joi.string().required(), // ObjectId of the Lesson
  sectionIds: Joi.array().items(Joi.string()), // Array of section IDs
  quizScore: Joi.number().min(0).max(100).required(),
  xpEarned: Joi.number().min(0).required(),
});

// Increment AI chat count
const incrementAIChatSchema = Joi.object({
  count: Joi.number().min(1).default(1),
});

// Delete progress
const deleteProgressSchema = Joi.object({
  learningId: Joi.string().required(),
});

module.exports = {
  startLearningTrackSchema,
  markLessonCompletedSchema,
  incrementAIChatSchema,
  deleteProgressSchema,
};
