const { Learning } = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

// Get all active learning tracks
const getAllLearnings = async (req, res, next) => {
  try {
    const learnings = await Learning.find({ isActive: true })
      .populate("sourceLanguage targetLanguage createdBy")
      .populate({
        path: "levels.lessons",
        select: "title isActive",
      });
    sendSuccess(res, 200, "Learning tracks fetched successfully", {
      learnings,
    });
  } catch (error) {
    next(error);
  }
};

// Get single learning track
const getLearning = async (req, res, next) => {
  try {
    const { id } = req.params;
    const learning = await Learning.findById(id)
      .populate("sourceLanguage targetLanguage createdBy")
      .populate({
        path: "levels.lessons",
        select: "title isActive",
      });

    if (!learning || !learning.isActive) {
      throw new AppError("Learning track not found", 404);
    }

    sendSuccess(res, 200, "Learning track fetched successfully", { learning });
  } catch (error) {
    next(error);
  }
};

// Create a new learning track
const createLearning = async (req, res, next) => {
  try {
    const {
      sourceLanguage,
      targetLanguage,
      title,
      description,
      levels,
      aiConfig,
    } = req.body;

    // Check for duplicate language pair
    const exists = await Learning.findOne({ sourceLanguage, targetLanguage });
    if (exists)
      throw new AppError(
        "Learning track for this language pair already exists",
        400,
      );

    const learning = await Learning.create({
      sourceLanguage,
      targetLanguage,
      title,
      description,
      levels,
      aiConfig,
      createdBy: req.user._id,
    });

    sendSuccess(res, 201, "Learning track created successfully", { learning });
  } catch (error) {
    next(error);
  }
};

// Update existing learning track
const updateLearning = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const learning = await Learning.findById(id);
    if (!learning) throw new AppError("Learning track not found", 404);

    // Prevent duplicate language pair on update
    if (updates.sourceLanguage || updates.targetLanguage) {
      const conflict = await Learning.findOne({
        _id: { $ne: id },
        sourceLanguage: updates.sourceLanguage || learning.sourceLanguage,
        targetLanguage: updates.targetLanguage || learning.targetLanguage,
      });
      if (conflict)
        throw new AppError(
          "Another learning track already exists for this language pair",
          400,
        );
    }

    learning.set(updates);
    await learning.save();

    sendSuccess(res, 200, "Learning track updated successfully", { learning });
  } catch (error) {
    next(error);
  }
};

// Soft delete a learning track
const deleteLearning = async (req, res, next) => {
  try {
    const { id } = req.params;
    const learning = await Learning.findById(id);
    if (!learning) throw new AppError("Learning track not found", 404);

    learning.isActive = false;
    await learning.save();

    sendSuccess(res, 200, "Learning track deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLearnings,
  getLearning,
  createLearning,
  updateLearning,
  deleteLearning,
};
