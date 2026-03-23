const mongoose = require("mongoose");

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
    currentLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
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
