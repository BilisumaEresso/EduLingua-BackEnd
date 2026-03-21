const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    // language user can speak
    language: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },
    //   language user want to speak
    preferredLanguage: {
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
    isActive: {
      type: Boolean,
      default: false,
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

const Lesson = mongoose.model("Lesson", lessonSchema);
module.exports = Lesson;
