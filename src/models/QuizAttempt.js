const mongoose = require("mongoose")

const quizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    learning: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Learning",
      required: true,
      index: true,
    },
    levelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
      index: true,
    },

    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted", "passed", "failed"],
      default: "in_progress",
      index: true,
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
    },

    quizPassingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },

    // Snapshot of which exact questions the learner attempted
    questionSnapshot: {
      quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
      questionIds: [{ type: mongoose.Schema.Types.ObjectId }],
      createdFromPoolAt: { type: Date },
    },

    submittedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
      min: 0,
    },
    reviewLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

quizAttemptSchema.index({ user: 1, learning: 1, levelId: 1, attemptNumber: 1 }, { unique: true })

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema)
module.exports = QuizAttempt

