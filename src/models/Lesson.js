// 2. Lesson Schema (The Container)
// LanguageID: Reference to Language.
// Level: Number (1–5).
// SequenceOrder: Number (e.g., 1, 2, 3) to ensure users take them in order.
// Title/Description: Text.
// Sections: Array of Reference IDs to the Section model.
// QuizID: Reference to a Quiz specifically for this lesson.

const mongoose = require("mongoose");

const lessonSchema = mongoose.Schema(
  {
    // language user can speak
    langauge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },
    //   language user want to speak
    preferedLanguage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    level: {
      type: Number,
      default: 1,
      max: 5,
      min: 1,
    },
    SequenceOrder: Number,
    //   title and desc must be in native lang of user
    title: {
      type: String,
      length: { max: 40, min: 3 },
      required: true,
    },
    desc: {
      type: String,
      length: { max: 150, min: 3 },
      required: true,
    },
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ],
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },
  },
  {
    timestamps: true,
  },
);

 const Lesson =mongoose.model('Lesson',lessonSchema)
 module.exports = Lesson;