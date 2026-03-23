// controllers/aiController.js
const Lesson = require("../models/Lesson");
const Section = require("../models/Section");
const aiService = require("../services/aiServices");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

// 🔹 Generate Sections (NO SAVE)
exports.generateSections = async (req, res, next) => {
  try {
    const { lessonId, maxSections } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError("Lesson not found", 404);

    // get last order
    const lastSection = await Section.findOne({ lesson: lessonId })
      .sort({ order: -1 })
      .select("order");

    const baseOrder = lastSection ? lastSection.order : 0;

    const sections = await aiService.generateSections(
      lesson,
      maxSections || 10,
    );

    // shift order
    const shifted = sections.map((sec, i) => ({
      ...sec,
      order: baseOrder + i + 1,
    }));

    sendSuccess(res, 200, "Sections generated", {
      sections: shifted,
      baseOrder,
    });
  } catch (err) {
    next(err);
  }
};

// 🔹 Generate Quiz (NO SAVE)
exports.generateQuiz = async (req, res, next) => {
  try {
    const { lessonId } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError("Lesson not found", 404);

    const sections = await Section.find({ lesson: lessonId });

    const quiz = await aiService.generateQuiz(lesson, sections);

    sendSuccess(res, 200, "Quiz generated", { quiz });
  } catch (err) {
    next(err);
  }
};
