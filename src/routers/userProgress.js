const express = require("express");
const isAuth = require("../middleware/isAuth");
const validate = require("../utils/validate");
const {
  getUserProgress,
  startLearningTrack,
  markLessonCompleted,
  incrementAIChat,
  deleteProgress,
} = require("../controllers/userProgress");
const {
  startLearningTrackSchema,
  markLessonCompletedSchema,
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

// Increment AI chat count
router.put(
  "/ai-chat",
  isAuth,
  validate(incrementAIChatSchema),
  incrementAIChat,
);

// Delete progress (for a learning track)
router.delete(
  "/delete",
  isAuth,
  validate(deleteProgressSchema),
  deleteProgress,
);

module.exports = router;
