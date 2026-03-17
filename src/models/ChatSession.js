const mongoose = require("mongoose");

const ChatSessionSchema = new mongoose.Schema(
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

    // This is the "Reminder" field you asked for
    aiMemorySummary: {
      type: String,
      default: "New student. No history yet.",
      trim: true,
    },

    messages: [
      {
        sender: { type: String, enum: ["user", "ai"] },
        text: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// Index for fast lookup when the user opens the chat
ChatSessionSchema.index({ userId: 1, languageId: 1 });

 const ChatSession = mongoose.model("ChatSession", ChatSessionSchema);
module.exports= ChatSession
