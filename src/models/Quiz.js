const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema({
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: true, // links to source content
  },
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ["multiple_choice", "text_input", "voice_match"],
    default: "multiple_choice",
  },
  options: [String], // for multiple choice
  correctAnswer: { type: String, required: true },
  explanation: String, // after user answers
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
  },
  skills: [
    {
      type: String,
      enum: ["vocabulary", "grammar", "conversation", "listening"],
    },
  ],
  isAiGenerated: { type: Boolean, default: true },
});

const quizSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      unique: true, // one quiz per lesson
    },
    title: { type: String, default: "Lesson Review" },
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
  const shuffled = this.questionPool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
