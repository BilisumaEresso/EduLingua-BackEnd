const { Language } = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

// Get all active languages
const getAllLang = async (req, res, next) => {
  try {
    const langs = await Language.find({ isActive: true });
    sendSuccess(res, 200, "Languages fetched successfully", { langs });
  } catch (error) {
    next(error);
  }
};

// Add a new language (only super admin)
const addLang = async (req, res, next) => {
  try {
    const { name, code } = req.body;

    // Check if name or code already exists (case-insensitive? adjust as needed)
    const existingName = await Language.findOne({ name });
    if (existingName) {
      throw new AppError("Language with this name already exists", 400);
    }

    const existingCode = await Language.findOne({ code });
    if (existingCode) {
      throw new AppError("Language with this code already exists", 400);
    }

    const lang = new Language({
      name,
      code,
      isActive: true,
    });
    await lang.save();

    sendSuccess(res, 201, "Language added successfully", { lang });
  } catch (error) {
    next(error);
  }
};

// Get a single language by its code (public)
const getLang = async (req, res, next) => {
  try {
    const { code } = req.params;
    const lang = await Language.findOne({ code, isActive: true });
    if (!lang) {
      throw new AppError("Language not found", 404);
    }
    sendSuccess(res, 200, "Language info fetched successfully", { lang });
  } catch (error) {
    next(error);
  }
};

// Update a language (only super admin)
const updateLang = async (req, res, next) => {
  try {
    const { code } = req.params; // code of the language to update
    const { name, code: newCode, isActive } = req.body;

    // Find the language
    const lang = await Language.findOne({ code });
    if (!lang) {
      throw new AppError("Language not found", 404);
    }

    // If updating name, check uniqueness
    if (name && name !== lang.name) {
      const nameExists = await Language.findOne({
        name,
        _id: { $ne: lang._id },
      });
      if (nameExists) {
        throw new AppError(
          "Another language with this name already exists",
          400,
        );
      }
      lang.name = name;
    }

    // If updating code, check uniqueness
    if (newCode && newCode !== lang.code) {
      const codeExists = await Language.findOne({
        code: newCode,
        _id: { $ne: lang._id },
      });
      if (codeExists) {
        throw new AppError(
          "Another language with this code already exists",
          400,
        );
      }
      lang.code = newCode;
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      lang.isActive = isActive;
    }

    await lang.save();

    sendSuccess(res, 200, "Language updated successfully", { lang });
  } catch (error) {
    next(error);
  }
};

// Delete a language (soft delete – set isActive false)
const deleteLang = async (req, res, next) => {
  try {
    const { code } = req.params;

    const lang = await Language.findOne({ code });
    if (!lang) {
      throw new AppError("Language not found", 404);
    }
    // Soft delete: set isActive to false
    lang.isActive = false;
    await lang.save();

    sendSuccess(res, 200, "Language deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllLang, addLang, getLang, updateLang, deleteLang };
