const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      unique: true, // One unique quiz per lesson
    },
    title: { type: String, default: "Lesson Review" },
    passingScore: {
      type: Number,
      default: 80, // User needs 80% to unlock next lesson
      min: 0,
      max: 100,
    },
    questions: [
      {
        questionText: { type: String, required: true },
        questionType: {
          type: String,
          enum: ["multiple_choice", "text_input", "voice_match"],
          default: "multiple_choice",
        },
        options: [String], // Only used for multiple_choice
        correctAnswer: { type: String, required: true },
        explanation: String, // Shown after the user answers
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Quiz", QuizSchema);
