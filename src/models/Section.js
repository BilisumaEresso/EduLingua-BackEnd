const mongoose = require("mongoose");

const contentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "video",
      "translation",
      "pronunciation_tip",
      "table",
      "hint",
      "ai_explanation",
    ],
    required: true,
  },
  // flexible to store multiple languages
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  isAiGenerated: { type: Boolean, default: true },
  metadata: {
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
});

const sectionSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
  },
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  ContentBlocks: [contentBlockSchema],
  resource: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
});

const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;
