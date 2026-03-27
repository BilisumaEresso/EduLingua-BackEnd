const mongoose = require("mongoose");

const contentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "translation",
      "explanation",
      "example",
      "exercise",
      "pronunciation",
      "hint",
    ],
    required: true,
  },

  payload: {
    text: String,
    translations: {
      source: String,
      target: String,
      alternatives: [String],
    },
    examples: [
      {
        source: String,
        target: String,
      },
    ],
    question: String,
    answer: String,
    hint: String,
  },

  isAiGenerated: {
    type: Boolean,
    default: true,
  },
});

const sectionSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    objective: {
      type: String,
      required: true,
    },
    contentBlocks: [contentBlockSchema],
    skills: [
      {
        type: String,
        enum: ["vocabulary", "grammar", "conversation", "listening"],
      },
    ],
    aiMeta: {
      promptSnapshot: String,
      difficulty: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ✅ removed resource from section
  },
  { timestamps: true },
);

// ensure order uniqueness inside lesson
sectionSchema.index({ lesson: 1, order: 1 }, { unique: true });

const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;
