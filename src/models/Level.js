const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema(
  {
    // 🔥 belongs to a specific learning path
    learning: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Learning",
      required: true,
      index: true,
    },

    // 🔥 level number (1–5)
    levelNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // 🔥 display info
    title: {
      type: String, // e.g. "Beginner", "Intermediate"
      required: true,
    },

    description: {
      type: String,
    },

    // 🔥 difficulty system (important for AI)
    difficulty: {
      type: String,
      enum: ["beginner", "elementary", "intermediate", "advanced", "master"],
      required: true,
    },

    // 🔥 progression rules
    unlockCondition: {
      minScore: {
        type: Number,
        default: 70, // % to pass
      },
      requiredLessonsCompleted: {
        type: Number,
        default: 0,
      },
    },

    // 🔥 lessons inside this level
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],

    // 🔥 ordering
    order: {
      type: Number,
      required: true,
    },

    // 🔥 AI tuning
    aiConfig: {
      focusAreas: [
        {
          type: String,
          enum: ["vocabulary", "grammar", "conversation", "listening"],
        },
      ],
      complexityBoost: {
        type: Number,
        default: 1, // increases with level
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// 🔥 prevent duplicate levels in same learning
levelSchema.index({ learning: 1, levelNumber: 1 }, { unique: true });

const Level = mongoose.model("Level", levelSchema);

module.exports = Level;
