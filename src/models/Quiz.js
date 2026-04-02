const mongoose = require("mongoose");

// models/Quiz.js
const quizQuestionSchema = new mongoose.Schema({
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: false, // Changed to false for AI support
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: false,
  },
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ["multiple_choice", "text_input", "voice_match"],
    default: "multiple_choice",
  },
  options: {
    type: [String],
    validate: {
      validator: function(v) {
        // Only require options if it's multiple choice
        if (this.questionType === "multiple_choice") {
          return v && v.length >= 2;
        }
        return true;
      },
      message: "Multiple choice questions require at least 2 options."
    }
  },
  correctAnswer: { type: String, required: true },
  explanation: String,
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
  skills: {
    type: [String],
    enum: ["vocabulary", "grammar", "conversation", "listening"],
    default: ["vocabulary"]
  },
  isAiGenerated: { type: Boolean, default: true },
});




const quizSchema = new mongoose.Schema(
  {
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
      unique: true, // one quiz per level
    },
    title: { type: String, default: "Level Review" },
    passingScore: { type: Number, default: 80, min: 0, max: 100 },
    // ✅ randomizable question pool
    questionPool: [quizQuestionSchema],
    // Optional: track quiz history/stats per lesson
    stats: {
      totalAttempts: { type: Number, default: 0 },
      avgScore: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

// 🔹 Helper method to get randomized questions
quizSchema.methods.getRandomQuestions = function (count = 10) {
  const pool = [...this.questionPool];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
};

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
