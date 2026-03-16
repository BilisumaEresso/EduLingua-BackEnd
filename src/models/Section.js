const mongoose = require("mongoose");

const sectionSchema = mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
  },
  order: {
    type: Number,
  },
  ContentBlocks: [
    {
      type: {
        type: String,
        enum: [
          "video",
          "translation",
          "pronunciation_tip",
          "table",
          "hint",
          "ai_explanatio",
        ],
      },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      isAiGenerated: { type: Boolean, default: false },
      metadata: {
        lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    },
  ],
  resource: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
});
