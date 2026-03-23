const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    // 🔥 belongs to a Level (which belongs to Learning)
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
      index: true,
    },

    // 🔥 teacher / creator
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 ordering inside level
    order: {
      type: Number,
      required: true,
    },

    // 🔥 content identity
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 80,
    },

    description: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 300,
    },

    // 🔥 learning objective (VERY IMPORTANT)
    objective: {
      type: String, // e.g. "Learn basic greetings in daily conversation"
      required: true,
    },

    // 🔥 AI CONTEXT (CORE FEATURE)
    aiContext: {
      topic: {
        type: String,
        required: true,
      },

      teacherPrompt: {
        type: String, // teacher instruction to AI
      },

      difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "easy",
      },

      generated: {
        type: Boolean,
        default: false,
      },
    },

    // 🔥 Sections (content)
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ],
    resources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
      },
    ],

    // 🔥 Quiz system (POOL, not single quiz)
    quizPool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },

    // 🔥 stats (future-proofing)
    stats: {
      totalQuestions: Number,
      avgScore: Number,
      attempts: Number,
    },

    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// 🔥 Prevent duplicate lesson order inside a level
lessonSchema.index({ level: 1, order: 1 }, { unique: true });

const Lesson = mongoose.model("Lesson", lessonSchema);

module.exports = Lesson;
