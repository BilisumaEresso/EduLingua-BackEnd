// models/UserProgress.js
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
    overallLevel: { type: Number, default: 1, min: 1, max: 5 },
    currentLessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    completedLessons: [
      {
        lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
        quizScore: Number,
        completedAt: { type: Date, default: Date.now },
      },
    ],
    completedSections: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    ], // new
    xp: { type: Number, default: 0 }, // new
    streak: { type: Number, default: 0 }, // new
    lastActivityDate: { type: Date, default: Date.now }, // new
  },
  { timestamps: true },
);

UserProgressSchema.index({ userId: 1, languageId: 1 }, { unique: true });

const UserProgress = mongoose.model("UserProgress", UserProgressSchema);
module.exports = UserProgress;
