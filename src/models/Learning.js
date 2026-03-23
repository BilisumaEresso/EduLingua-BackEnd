const mongoose = require("mongoose");

const learningSchema = new mongoose.Schema(
  {
    // 🔥 Core identity (language pair)
    sourceLanguage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },

    targetLanguage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },

    // 🔥 Who created this learning path
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 Organization
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    // 🔥 Lessons grouped by level (1–5)
    levels: [
      {
        levelNumber: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
        lessons: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
          },
        ],
      },
    ],

    // 🔥 AI configuration for whole learning
    aiConfig: {
      basePrompt: String, // teacher global instruction
      difficultyCurve: {
        type: String,
        enum: ["linear", "adaptive"],
        default: "linear",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// 🔥 Prevent duplicate language pairs
learningSchema.index(
  { sourceLanguage: 1, targetLanguage: 1 },
  { unique: true },
);

const Learning = mongoose.model("Learning", learningSchema);

module.exports = Learning;
