const { Level, Learning } = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

// Get all levels for a learning track
const getAllLevels = async (req, res, next) => {
  try {
    const { learningId } = req.query;
    if (learningId) {
      const levels = await Level.find({ learning: learningId, isActive: true })
        .populate("lessons")
        .sort({ order: 1 });
      sendSuccess(res, 200, "Levels fetched successfully", { levels });
      return;
    }
    const levels = await Level.find({ isActive: true })
      .populate("lessons")
      .sort({ order: 1 });

    sendSuccess(res, 200, "Levels fetched successfully", { levels });
  } catch (error) {
    next(error);
  }
};

// Get a single level
const getLevel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const level = await Level.findById(id).populate("lessons");
    if (!level || !level.isActive) throw new AppError("Level not found", 404);

    sendSuccess(res, 200, "Level fetched successfully", { level });
  } catch (error) {
    next(error);
  }
};

// Create a new level
const createLevel = async (req, res, next) => {
  try {
    const {
      learning,
      levelNumber,
      title,
      description,
      difficulty,
      unlockCondition,
      lessons,
      order,
      aiConfig,
    } = req.body;

    const learningExists = await Learning.findById(learning);
    if (!learningExists) throw new AppError("Learning track not found", 404);

    const exists = await Level.findOne({ learning, levelNumber });
    if (exists)
      throw new AppError(
        "Level number already exists for this learning track",
        400,
      );

    const level = await Level.create({
      learning,
      levelNumber,
      title,
      description,
      difficulty,
      unlockCondition,
      lessons,
      order,
      aiConfig,
    });

    sendSuccess(res, 201, "Level created successfully", { level });
  } catch (error) {
    next(error);
  }
};

// Update level
const updateLevel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const level = await Level.findById(id);
    if (!level) throw new AppError("Level not found", 404);

    if (updates.levelNumber && updates.levelNumber !== level.levelNumber) {
      const conflict = await Level.findOne({
        learning: level.learning,
        levelNumber: updates.levelNumber,
        _id: { $ne: id },
      });
      if (conflict)
        throw new AppError(
          "Level number already exists for this learning track",
          400,
        );
    }

    level.set(updates);
    await level.save();

    sendSuccess(res, 200, "Level updated successfully", { level });
  } catch (error) {
    next(error);
  }
};

// Soft delete a level
const deleteLevel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const level = await Level.findById(id);
    if (!level) throw new AppError("Level not found", 404);

    level.isActive = false;
    await level.save();

    sendSuccess(res, 200, "Level deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLevels,
  getLevel,
  createLevel,
  updateLevel,
  deleteLevel,
};
