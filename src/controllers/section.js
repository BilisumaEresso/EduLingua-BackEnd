const { Section, Lesson } = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

// Get all sections (optionally filtered by lesson)
const getAllSections = async (req, res, next) => {
  try {
    const { lessonId } = req.query;
    const filter = {};
    if (lessonId) filter.lesson = lessonId;

    const sections = await Section.find(filter).sort({ order: 1 });
    sendSuccess(res, 200, "Sections fetched successfully", { sections });
  } catch (error) {
    next(error);
  }
};

// Get a single section
const getSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const section = await Section.findById(id);
    if (!section) throw new AppError("Section not found", 404);
    sendSuccess(res, 200, "Section fetched successfully", { section });
  } catch (error) {
    next(error);
  }
};

// Create a new section
const createSection = async (req, res, next) => {
  try {
    const { lesson, order } = req.body;

    // Validate lesson exists
    const lessonExists = await Lesson.findById(lesson);
    if (!lessonExists) throw new AppError("Lesson not found", 404);

    // Check order uniqueness inside lesson
    const exists = await Section.findOne({ lesson, order });
    if (exists)
      throw new AppError("Section order already exists for this lesson", 400);

    const section = await Section.create(req.body);
    sendSuccess(res, 201, "Section created successfully", { section });
  } catch (error) {
    next(error);
  }
};

// Update section
const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const section = await Section.findById(id);
    if (!section) throw new AppError("Section not found", 404);

    // Check for order conflicts
    if (updates.order && updates.order !== section.order) {
      const conflict = await Section.findOne({
        lesson: section.lesson,
        order: updates.order,
        _id: { $ne: id },
      });
      if (conflict)
        throw new AppError("Section order already exists for this lesson", 400);
    }

    section.set(updates);
    await section.save();

    sendSuccess(res, 200, "Section updated successfully", { section });
  } catch (error) {
    next(error);
  }
};
const createSectionsBulk = async (req, res, next) => {
  try {
    const { lessonId, sections } = req.body;

    if (!sections || !Array.isArray(sections)) {
      throw new AppError("Sections are required", 400);
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError("Lesson not found", 404);

    const created = [];

    for (const sec of sections) {
      const section = new Section({
        lesson: lessonId,
        title: sec.title,
        order: sec.order,
        objective: sec.objective,
        contentBlocks: sec.contentBlocks,
        skills: sec.skills,
        aiMeta: {
          promptSnapshot: "",
          difficulty: sec.difficulty,
        },
      });

      await section.save();
      created.push(section);
    }

    sendSuccess(res, 201, "Sections saved successfully", { sections: created });
  } catch (err) {
    next(err);
  }
};

// Delete section (soft delete)
const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const section = await Section.findById(id);
    if (!section) throw new AppError("Section not found", 404);

    section.isActive = false;
    await section.save();

    sendSuccess(res, 200, "Section deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  createSectionsBulk
};
