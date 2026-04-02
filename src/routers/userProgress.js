const express = require("express");
const isAuth = require("../middleware/isAuth");
const validate = require("../utils/validate");
const {
  getUserProgress,
  startLearningTrack,
  markLessonCompleted,
  quizStartAttempt,
  quizSubmitAttempt,
  completeLevel,
  incrementAIChat,
  deleteProgress,
} = require("../controllers/userProgress");
const {
  startLearningTrackSchema,
  markLessonCompletedSchema,
  completeLevelSchema,
  quizStartSchema,
  quizSubmitSchema,
  incrementAIChatSchema,
  deleteProgressSchema,
} = require("../validations/userProgressValidator");

const router = express.Router();

// Get user progress for a specific learning track or all
router.get("/", isAuth, getUserProgress);
// Start a learning track
router.post(
  "/start",
  isAuth,
  validate(startLearningTrackSchema),
  startLearningTrack,
);

// Mark lesson completed
router.put(
  "/lesson-complete",
  isAuth,
  validate(markLessonCompletedSchema),
  markLessonCompleted,
);

// Start a quiz attempt
router.post(
  "/quiz/start",
  isAuth,
  validate(quizStartSchema),
  quizStartAttempt,
);

// Submit quiz attempt (server computes score + unlocks/retains progress)
router.post(
  "/quiz/submit",
  isAuth,
  validate(quizSubmitSchema),
  quizSubmitAttempt,
);

// Mark level completed
router.put(
  "/level-complete",
  isAuth,
  validate(completeLevelSchema),
  completeLevel,
);

// Increment AI chat count
router.put(
  "/ai-chat",
  isAuth,
  validate(incrementAIChatSchema),
  incrementAIChat,
);

// Delete progress (for a learning track)
router.delete(
  "/delete/:learningId",
  isAuth,
  validate(deleteProgressSchema, "params"),
  deleteProgress,
);

module.exports = router;
