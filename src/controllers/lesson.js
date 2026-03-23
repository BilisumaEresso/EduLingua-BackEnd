const { Lesson, Level, Section, Resource, Quiz } = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

// Get all lessons (optionally filtered by level)
const getAllLessons = async (req, res, next) => {
  try {
    const { levelId } = req.query;

    const filter = { isActive: true };
    if (levelId) filter.level = levelId;

    const lessons = await Lesson.find(filter)
      .populate("sections")
      .populate("resources")
      .populate("quizPool")
      .sort({ order: 1 });

    sendSuccess(res, 200, "Lessons fetched successfully", { lessons });
  } catch (error) {
    next(error);
  }
};

// Get single lesson
const getLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id)
      .populate("sections")
      .populate("resources")
      .populate("quizPool");
    if (!lesson || !lesson.isActive)
      throw new AppError("Lesson not found", 404);

    sendSuccess(res, 200, "Lesson fetched successfully", { lesson });
  } catch (error) {
    next(error);
  }
};

// Create new lesson
const createLesson = async (req, res, next) => {
  try {
    const { level, order, title } = req.body;

    // Validate level existence
    const levelExists = await Level.findById(level);
    if (!levelExists) throw new AppError("Level not found", 404);

    // Check duplicate order
    const exists = await Lesson.findOne({ level, order });
    if (exists)
      throw new AppError("Lesson order already exists for this level", 400);

    const lesson = await Lesson.create(req.body);
    sendSuccess(res, 201, "Lesson created successfully", { lesson });
  } catch (error) {
    next(error);
  }
};

// Update lesson
const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const lesson = await Lesson.findById(id);
    if (!lesson) throw new AppError("Lesson not found", 404);

    // If order is updated, check for conflict
    if (updates.order && updates.order !== lesson.order) {
      const conflict = await Lesson.findOne({
        level: lesson.level,
        order: updates.order,
        _id: { $ne: id },
      });
      if (conflict)
        throw new AppError("Lesson order already exists for this level", 400);
    }

    lesson.set(updates);
    await lesson.save();

    sendSuccess(res, 200, "Lesson updated successfully", { lesson });
  } catch (error) {
    next(error);
  }
};

// Soft delete lesson
const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) throw new AppError("Lesson not found", 404);

    lesson.isActive = false;
    await lesson.save();

    sendSuccess(res, 200, "Lesson deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
};
