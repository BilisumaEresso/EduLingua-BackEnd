const mongoose = require("mongoose");

const UserProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    languageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },
    // The specific level (1-5) the user is currently working through
    overallLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    // The "active" lesson they are currently stuck on or studying
    currentLessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
    // History of everything they have passed
    completedLessons: [
      {
        lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
        quizScore: Number,
        completedAt: { type: Date, default: Date.now },
      },
    ],
    // For "Streaks" or engagement tracking
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Ensure a user has only one progress record per language
UserProgressSchema.index({ userId: 1, languageId: 1 }, { unique: true });

module.exports = mongoose.model("UserProgress", UserProgressSchema);