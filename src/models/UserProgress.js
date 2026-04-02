const mongoose = require("mongoose");

const levelLessonProgressSchema = new mongoose.Schema(
  {
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    status: { type: String, enum: ["done", "skipped"], required: true },
    doneAt: { type: Date },
    skippedAt: { type: Date },
  },
  { _id: false },
)

const levelProgressSchema = new mongoose.Schema(
  {
    levelId: { type: mongoose.Schema.Types.ObjectId, ref: "Level", required: true, index: true },
    status: {
      type: String,
      enum: ["locked", "active", "passed", "failed", "review"],
      default: "locked",
      index: true,
    },
    minScore: { type: Number, default: 70 },
    lessonProgress: [levelLessonProgressSchema],

    passedAt: { type: Date },
    lastQuizAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: "QuizAttempt" },

    lastQuizScore: { type: Number, min: 0, max: 100 },
    bestQuizScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false },
)

const userProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    learning: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Learning",
      required: true,
    },
    overallLevel: { type: Number, default: 1, min: 1, max: 5 },
    currentLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
    },
    // Server-authoritative phase for the *current* level
    // - lessons: user must go through lessons (can mark done/skip)
    // - quiz: learner is allowed to start/retake quiz for current level
    // - review: quiz is passed; learner may review lessons only
    activePhase: {
      type: String,
      enum: ["lessons", "quiz", "review"],
      default: "lessons",
    },
    currentLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
    // Professional per-level tracking (embedded for performance).
    // We keep legacy fields (overallLevel/currentLevel/currentLesson/completedLessons)
    // for compatibility while frontend/backend get refactored.
    levelsProgress: [levelProgressSchema],

    completedLessons: [
      {
        lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
        quizScore: { type: Number, min: 0, max: 100 },
        completedAt: { type: Date, default: Date.now },
      },
    ],
    completedSections: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    ],
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: Date.now },
    // AI tracking per user
    aiChatCount: { type: Number, default: 0 },
    aiChatResetAt: { type: Date },
  },
  { timestamps: true },
);

userProgressSchema.index({ user: 1, learning: 1 }, { unique: true });

const UserProgress = mongoose.model("UserProgress", userProgressSchema);
module.exports = UserProgress;
