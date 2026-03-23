const { Language } = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

const normalize = (str) => str.trim().toLowerCase();

// Get all active languages
const getAllLang = async (req, res, next) => {
  try {
    const langs = await Language.find({ isActive: true }).sort({ name: 1 });
    sendSuccess(res, 200, "Languages fetched successfully", { langs });
  } catch (error) {
    next(error);
  }
};

// Add a new language (super admin only)
const addLang = async (req, res, next) => {
  try {
    const { name, code, nativeName, direction, metadata } = req.body;

    const normalizedName = normalize(name);

    // Check uniqueness by name or code
    const exists = await Language.findOne({
      $or: [{ name: normalizedName }, { code }],
    });
    if (exists) {
      throw new AppError("Language with this name or code already exists", 400);
    }

    const lang = await Language.create({
      name: normalizedName,
      code,
      nativeName,
      direction: direction || "ltr",
      metadata,
    });

    sendSuccess(res, 201, "Language added successfully", { lang });
  } catch (error) {
    next(error);
  }
};

// Get a single language by ID (public)
const getLang = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lang = await Language.findOne({ _id: id, isActive: true });
    if (!lang) throw new AppError("Language not found", 404);

    sendSuccess(res, 200, "Language info fetched successfully", { lang });
  } catch (error) {
    next(error);
  }
};

// Update a language (super admin only)
const updateLang = async (req, res, next) => {
  try {
    const { id } = req.params;
    let {
      name,
      code: newCode,
      isActive,
      nativeName,
      direction,
      metadata,
    } = req.body;

    const lang = await Language.findById(id);
    if (!lang) throw new AppError("Language not found", 404);

    // Normalize name
    if (name) name = normalize(name);

    // Check name uniqueness
    if (name && name !== lang.name) {
      const nameExists = await Language.findOne({
        name,
        _id: { $ne: lang._id },
      });
      if (nameExists)
        throw new AppError(
          "Another language with this name already exists",
          400,
        );
      lang.name = name;
    }

    // Check code uniqueness
    if (newCode && newCode !== lang.code) {
      const codeExists = await Language.findOne({
        code: newCode,
        _id: { $ne: lang._id },
      });
      if (codeExists)
        throw new AppError(
          "Another language with this code already exists",
          400,
        );
      lang.code = newCode;
    }

    // Update other fields
    if (isActive !== undefined) lang.isActive = isActive;
    if (nativeName !== undefined) lang.nativeName = nativeName;
    if (direction !== undefined) lang.direction = direction;
    if (metadata !== undefined) lang.metadata = metadata;

    await lang.save();

    sendSuccess(res, 200, "Language updated successfully", { lang });
  } catch (error) {
    next(error);
  }
};

// Soft delete a language (set isActive = false)
const deleteLang = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lang = await Language.findById(id);
    if (!lang) throw new AppError("Language not found", 404);

    lang.isActive = false;
    await lang.save();

    sendSuccess(res, 200, "Language deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllLang, addLang, getLang, updateLang, deleteLang };
