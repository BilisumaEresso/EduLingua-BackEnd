// controllers/lessonController.js
const {
  Lesson,
  Section,
  Resource,
  Quiz,
  UserProgress,
  User,
  Language,
} = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");
const mongoose = require("mongoose");

// ========== Lesson CRUD ==========

exports.addLesson = async (req, res, next) => {
  try {
    const { language, preferredLanguage, level, title, desc } = req.body;
    const teacher = req.user._id;

    // Verify languages exist
    const [lang, prefLang] = await Promise.all([
      Language.findById(language),
      Language.findById(preferredLanguage),
    ]);
    if (!lang || !prefLang) throw new AppError("Invalid language(s)", 400);

    // Determine sequence order for this teacher
    const count = await Lesson.countDocuments({ teacher });
    const sequenceOrder = count + 1;

    const lesson = new Lesson({
      language: language, // note: field name in schema is "language" (typo)
      preferredLanguage,
      teacher,
      level,
      title,
      desc,
      sequenceOrder,
    });

    await lesson.save();
    sendSuccess(res, 201, "Lesson created", { lesson });
  } catch (error) {
    next(error);
  }
};

exports.updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const lesson = await Lesson.findOne({ _id: id, teacher: req.user._id });
    if (!lesson) throw new AppError("Lesson not found or not yours", 404);

    // Update allowed fields
    if (updates.language) {
      const lang = await Language.findById(updates.language);
      if (!lang) throw new AppError("Invalid language", 400);
      lesson.language = updates.language;
    }
    if (updates.preferredLanguage) {
      const prefLang = await Language.findById(updates.preferredLanguage);
      if (!prefLang) throw new AppError("Invalid preferred language", 400);
      lesson.preferredLanguage = updates.preferredLanguage;
    }
    if (updates.level) lesson.level = updates.level;
    if (updates.title) lesson.title = updates.title;
    if (updates.desc) lesson.desc = updates.desc;
    if (updates.isActive !== undefined) lesson.isActive = updates.isActive;

    await lesson.save();
    sendSuccess(res, 200, "Lesson updated", { lesson });
  } catch (error) {
    next(error);
  }
};

exports.deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findOne({ _id: id, teacher: req.user._id });
    if (!lesson) throw new AppError("Lesson not found or not yours", 404);
    // Soft delete – assume isActive field exists
    lesson.isActive = false;
    await lesson.save();
    sendSuccess(res, 200, "Lesson deleted");
  } catch (error) {
    next(error);
  }
};

exports.getMyLessons = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const lessons = await Lesson.find({ teacher: req.user._id, isActive: true })
      .skip(skip)
      .limit(limit)
      .populate("language preferredLanguage", "name code")
      .lean();
    const total = await Lesson.countDocuments({
      teacher: req.user._id,
      isActive: true,
    });
    sendSuccess(res, 200, "My lessons", {
      lessons,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getLessonById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findOne({
      _id: id,
      teacher: req.user._id,
      isActive: true,
    })
      .populate("language preferredLanguage", "name code")
      .populate("sections") // Sections array populated
      .populate("quiz") // Quiz populated
      .lean();
    if (!lesson) throw new AppError("Lesson not found", 404);
    sendSuccess(res, 200, "Lesson fetched", { lesson });
  } catch (error) {
    next(error);
  }
};

// ========== Sections ==========

// Helper: Normalize content blocks for DB
const formatContentBlocks = (blocks) => {
  return blocks.map(block => {
    let data = {};
    switch (block.type) {
      case "translation":
        // flexible for multiple languages
        data = { ...block }; // contains swahli, english, amharic, etc.
        break;
      case "ai_explanation":
        data = { content: block.content };
        break;
      default:
        data = block.data || {};
    }
    return {
      type: block.type,
      data,
      isAiGenerated: true,
    };
  });
};

exports.addSection = async (req, res, next) => {
  try {
    const { lessonId, order, title, contentBlocks, resourceIds } = req.body;

    const lesson = await Lesson.findOne({ _id: lessonId, teacher: req.user._id });
    if (!lesson) throw new AppError("Lesson not found or not yours", 404);

    const section = new Section({
      lesson: lessonId,
      title,
      order: order || 0,
      ContentBlocks: contentBlocks ? formatContentBlocks(contentBlocks) : [],
      resource: resourceIds || [],
    });

    await section.save();

    lesson.sections.push(section._id);
    await lesson.save();

    sendSuccess(res, 201, "Section added", { section });
  } catch (error) {
    next(error);
  }
};

exports.updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, order, contentBlocks, resourceIds } = req.body;

    const section = await Section.findById(id).populate("lesson");
    if (!section) throw new AppError("Section not found", 404);

    const lesson = await Lesson.findOne({ _id: section.lesson._id, teacher: req.user._id });
    if (!lesson) throw new AppError("Not authorized", 403);

    if (title !== undefined) section.title = title;
    if (order !== undefined) section.order = order;
    if (contentBlocks) section.ContentBlocks = formatContentBlocks(contentBlocks);
    if (resourceIds) section.resource = resourceIds;

    await section.save();

    sendSuccess(res, 200, "Section updated", { section });
  } catch (error) {
    next(error);
  }
};

exports.deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const section = await Section.findById(id).populate("lesson");
    if (!section) throw new AppError("Section not found", 404);

    const lesson = await Lesson.findOne({ _id: section.lesson._id, teacher: req.user._id });
    if (!lesson) throw new AppError("Not authorized", 403);

    lesson.sections.pull(section._id);
    await lesson.save();

    await section.deleteOne();

    sendSuccess(res, 200, "Section deleted");
  } catch (error) {
    next(error);
  }
};

exports.getSectionsByLesson = async (req, res, next) => {
  try {
    const { id } = req.params; // lesson id
    const lesson = await Lesson.findById(id).populate({
      path: "sections",
      populate: { path: "resource" }, // populate resources inside each section
    });
    if (!lesson) throw new AppError("Lesson not found", 404);
    sendSuccess(res, 200, "Sections fetched", { sections: lesson.sections });
  } catch (error) {
    next(error);
  }
};

// ========== Resources ==========

exports.addResource = async (req, res, next) => {
  try {
    const { id } = req.params; // section id
    const { title, type, url, tags } = req.body;

    const section = await Section.findById(id).populate("lesson");
    if (!section) throw new AppError("Section not found", 404);
    const lesson = await Lesson.findOne({
      _id: section.lesson,
      teacher: req.user._id,
    });
    if (!lesson) throw new AppError("Not authorized", 403);

    const resource = new Resource({
      title,
      type,
      url,
      uploadedBy: req.user._id,
      tags: tags || [],
    });
    await resource.save();

    // Add resource to section's resource array
    section.resource.push(resource._id);
    await section.save();

    sendSuccess(res, 201, "Resource added", { resource });
  } catch (error) {
    next(error);
  }
};

exports.updateResource = async (req, res, next) => {
  try {
    const { id } = req.params; // resource id
    const updates = req.body;
    const resource = await Resource.findById(id);
    if (!resource) throw new AppError("Resource not found", 404);

    // Check ownership via lesson (optional: ensure the teacher owns the lesson containing this resource)
    const section = await Section.findOne({ resource: id }).populate("lesson");
    if (section) {
      const lesson = await Lesson.findOne({
        _id: section.lesson,
        teacher: req.user._id,
      });
      if (!lesson) throw new AppError("Not authorized", 403);
    }

    Object.assign(resource, updates);
    await resource.save();

    sendSuccess(res, 200, "Resource updated", { resource });
  } catch (error) {
    next(error);
  }
};

exports.deleteResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);
    if (!resource) throw new AppError("Resource not found", 404);

    // Find the section containing this resource and remove reference
    const section = await Section.findOne({ resource: id }).populate("lesson");
    if (section) {
      const lesson = await Lesson.findOne({
        _id: section.lesson,
        teacher: req.user._id,
      });
      if (!lesson) throw new AppError("Not authorized", 403);
      section.resource.pull(id);
      await section.save();
    }

    await resource.deleteOne();
    sendSuccess(res, 200, "Resource deleted");
  } catch (error) {
    next(error);
  }
};

exports.getResourcesBySection = async (req, res, next) => {
  try {
    const { id } = req.params; // section id
    const section = await Section.findById(id).populate("resource");
    if (!section) throw new AppError("Section not found", 404);
    sendSuccess(res, 200, "Resources fetched", { resources: section.resource });
  } catch (error) {
    next(error);
  }
};

exports.getResourceById = async (req, res, next) => {
  try {
    const { id } = req.params; // resource id
    const resource = await Resource.findById(id);
    if (!resource) throw new AppError("Resource not found", 404);
    sendSuccess(res, 200, "Resource fetched", { resource });
  } catch (error) {
    next(error);
  }
};

// ========== Quizzes ==========

exports.addQuiz = async (req, res, next) => {
  try {
    const { lessonId, title, passingScore, questions } = req.body;
    const lesson = await Lesson.findOne({
      _id: lessonId,
      teacher: req.user._id,
    });
    if (!lesson) throw new AppError("Lesson not found or not yours", 404);

    // Check if quiz already exists for this lesson
    const existingQuiz = await Quiz.findOne({ lessonId });
    if (existingQuiz)
      throw new AppError("Quiz already exists for this lesson", 400);

    const quiz = new Quiz({
      lessonId,
      title: title || "Lesson Review",
      passingScore: passingScore || 80,
      questions,
    });
    await quiz.save();

    // Link quiz to lesson
    lesson.quiz = quiz._id;
    await lesson.save();

    sendSuccess(res, 201, "Quiz added", { quiz });
  } catch (error) {
    next(error);
  }
};

exports.getQuizByLesson = async (req, res, next) => {
  try {
    const { id } = req.params; // lesson id
    const quiz = await Quiz.findOne({ lessonId: id });
    if (!quiz) throw new AppError("Quiz not found", 404);
    sendSuccess(res, 200, "Quiz fetched", { quiz });
  } catch (error) {
    next(error);
  }
};

exports.updateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params; // quiz id
    const updates = req.body;
    const quiz = await Quiz.findById(id);
    if (!quiz) throw new AppError("Quiz not found", 404);

    // Verify ownership via lesson
    const lesson = await Lesson.findOne({
      _id: quiz.lessonId,
      teacher: req.user._id,
    });
    if (!lesson) throw new AppError("Not authorized", 403);

    Object.assign(quiz, updates);
    await quiz.save();

    sendSuccess(res, 200, "Quiz updated", { quiz });
  } catch (error) {
    next(error);
  }
};

exports.deleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params; // quiz id
    const quiz = await Quiz.findById(id);
    if (!quiz) throw new AppError("Quiz not found", 404);

    const lesson = await Lesson.findOne({
      _id: quiz.lessonId,
      teacher: req.user._id,
    });
    if (!lesson) throw new AppError("Not authorized", 403);

    await quiz.deleteOne();
    lesson.quiz = null;
    await lesson.save();

    sendSuccess(res, 200, "Quiz deleted");
  } catch (error) {
    next(error);
  }
};

// ========== Student Endpoints ==========

exports.getAllLessonsForStudent = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, languageId } = req.query; // optional filter by target language
    const skip = (page - 1) * limit;
    const filter = { isActive: true };
    if (languageId) filter.preferredLanguage = languageId;

    const lessons = await Lesson.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("language preferredLanguage", "name code")
      .populate("teacher", "name").populate("sections")
      .lean();
    const total = await Lesson.countDocuments(filter);
    sendSuccess(res, 200, "Lessons fetched", {
      lessons,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getLessonForStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id)
      .populate("language preferredLanguage", "name code")
      .populate("teacher", "name")
      .populate({
        path: "sections",
        populate: { path: "resource" },
      })
      .lean();
    if (!lesson) throw new AppError("Lesson not found", 404);

    // Optionally get user's progress for this lesson (if we have a progress model)
    // Using UserProgress model: find progress for this language (lesson.preferredLanguage)
    let progress = null;
    if (req.user) {
      const userProgress = await UserProgress.findOne({
        userId: req.user._id,
        languageId: lesson.preferredLanguage,
      });
      if (userProgress) {
        const lessonProgress = userProgress.completedLessons.find(
          (l) => l.lessonId.toString() === id,
        );
        progress = lessonProgress || null;
      }
    }
    sendSuccess(res, 200, "Lesson fetched", { lesson, progress });
  } catch (error) {
    next(error);
  }
};

exports.startLesson = async (req, res, next) => {
  // For now, we don't have a start concept; progress is tracked via completedLessons.
  // We could create a "currentLessonId" in UserProgress.
  try {
    const { id } = req.params; // lesson id
    const lesson = await Lesson.findById(id);
    if (!lesson) throw new AppError("Lesson not found", 404);

    let userProgress = await UserProgress.findOne({
      userId: req.user._id,
      languageId: lesson.preferredLanguage,
    });
    if (!userProgress) {
      userProgress = new UserProgress({
        userId: req.user._id,
        languageId: lesson.preferredLanguage,
        currentLessonId: id,
      });
      await userProgress.save();
    } else {
      userProgress.currentLessonId = id;
      await userProgress.save();
    }
    sendSuccess(res, 200, "Lesson started", { currentLessonId: id });
  } catch (error) {
    next(error);
  }
};

exports.finishLesson = async (req, res, next) => {
  try {
    const { id } = req.params; // lesson id
    const lesson = await Lesson.findById(id);
    if (!lesson) throw new AppError("Lesson not found", 404);

    let userProgress = await UserProgress.findOne({
      userId: req.user._id,
      languageId: lesson.preferredLanguage,
    });
    if (!userProgress) {
      userProgress = new UserProgress({
        userId: req.user._id,
        languageId: lesson.preferredLanguage,
      });
    }

    // Check if lesson already completed
    const alreadyCompleted = userProgress.completedLessons.some(
      (l) => l.lessonId.toString() === id,
    );
    if (alreadyCompleted) throw new AppError("Lesson already completed", 400);

    // Add to completed lessons
    userProgress.completedLessons.push({
      lessonId: id,
      completedAt: new Date(),
    });
    // Optionally update overall level if all lessons of current level are completed
    // For simplicity, we'll just update lastActivity
    userProgress.lastActivity = new Date();
    await userProgress.save();

    sendSuccess(res, 200, "Lesson completed");
  } catch (error) {
    next(error);
  }
};

exports.cancelLesson = async (req, res, next) => {
  // For now, we just clear currentLessonId if it matches
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) throw new AppError("Lesson not found", 404);

    const userProgress = await UserProgress.findOne({
      userId: req.user._id,
      languageId: lesson.preferredLanguage,
    });
    if (
      userProgress &&
      userProgress.currentLessonId &&
      userProgress.currentLessonId.toString() === id
    ) {
      userProgress.currentLessonId = null;
      await userProgress.save();
    }
    sendSuccess(res, 200, "Lesson cancelled");
  } catch (error) {
    next(error);
  }
};

exports.retakeLesson = async (req, res, next) => {
  // For now, just remove from completed lessons if present, and optionally reset quiz
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) throw new AppError("Lesson not found", 404);

    const userProgress = await UserProgress.findOne({
      userId: req.user._id,
      languageId: lesson.preferredLanguage,
    });
    if (userProgress) {
      // Remove from completedLessons
      userProgress.completedLessons = userProgress.completedLessons.filter(
        (l) => l.lessonId.toString() !== id,
      );
      // Also reset quiz attempts? Possibly not stored here.
      await userProgress.save();
    }
    sendSuccess(res, 200, "Lesson reset, you can retake");
  } catch (error) {
    next(error);
  }
};

// Controller for finishing a section

exports.finishSection = async (req, res, next) => {
  try {
    const { lessonId, sectionId } = req.body;
    const userId = req.user._id;

    // 1. Get the lesson to find its language
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError("Lesson not found", 404);
    const languageId = lesson.preferredLanguage; // use correct field name from your lesson schema

    // 2. Find or create user progress for this language
    let progress = await UserProgress.findOne({ userId, languageId });
    if (!progress) {
      progress = new UserProgress({
        userId,
        languageId,
        overallLevel: lesson.level,
        currentLessonId: lessonId,
        completedSections: [],
        completedLessons: []
      });
      await progress.save();
    }

    // 3. Check if section already completed
    if (progress.completedSections.includes(sectionId)) {
      throw new AppError("Section already completed", 400);
    }

    // 4. Mark section as completed
    progress.completedSections.push(sectionId);

    // 5. Award XP (customize value)
    progress.xp = (progress.xp || 0) + 10;

    // 6. Update streak logic
    const today = new Date().setHours(0, 0, 0, 0);
    const lastActivity = progress.lastActivityDate ? new Date(progress.lastActivityDate).setHours(0, 0, 0, 0) : null;
    if (lastActivity === today) {
      // Already active today, streak unchanged
    } else if (lastActivity === today - 86400000) { // yesterday
      progress.streak = (progress.streak || 0) + 1;
    } else {
      progress.streak = 1; // new streak starts
    }
    progress.lastActivityDate = new Date();

    // 7. Save progress
    await progress.save();

    // 8. Check if all sections of this lesson are completed
    const lessonWithSections = await Lesson.findById(lessonId).populate("sections");
    const allSectionsCompleted = lessonWithSections.sections.every(section =>
      progress.completedSections.some(completedId => completedId.toString() === section._id.toString())
    );

    // 9. Prepare response
    let quizUnlocked = false;
    if (allSectionsCompleted) {
      // Optionally mark that the lesson is ready for quiz
      // Could set a flag in progress (e.g., lessonReadyForQuiz = true) if needed
      quizUnlocked = true;
    }

    sendSuccess(res, 200, "Section completed", {
      progress: {
        xp: progress.xp,
        streak: progress.streak,
        completedSectionsCount: progress.completedSections.length,
        allSectionsCompleted,
        quizUnlocked
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.takeQuiz = async (req, res, next) => {
  try {
    const { id } = req.params; // lesson id
    const { answers } = req.body; // array of { questionId, answer } (questionId is index or _id)

    const lesson = await Lesson.findById(id).populate("quiz");
    if (!lesson || !lesson.quiz) throw new AppError("Quiz not found", 404);

    const quiz = lesson.quiz;
    let score = 0;
    const results = [];
    for (const ans of answers) {
      const question = quiz.questions[ans.questionId]; // assuming questionId is index
      if (!question) continue;
      const isCorrect = question.correctAnswer === ans.answer;
      if (isCorrect) score++;
      results.push({
        questionId: ans.questionId,
        answer: ans.answer,
        isCorrect,
      });
    }
    const percentage = (score / quiz.questions.length) * 100;
    const passed = percentage >= quiz.passingScore;

    // Update user progress with quiz result
    const userProgress = await UserProgress.findOne({
      userId: req.user._id,
      languageId: lesson.preferredLanguage,
    });
    if (userProgress) {
      const lessonProgress = userProgress.completedLessons.find(
        (l) => l.lessonId.toString() === id,
      );
      if (lessonProgress) {
        lessonProgress.quizScore = percentage;
        // Optionally mark quiz passed? But we already have completed lesson.
      } else {
        // If lesson not completed, maybe we should not store quiz result
      }
      await userProgress.save();
    }

    sendSuccess(res, 200, "Quiz submitted", {
      score: percentage,
      passed,
      results,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelQuiz = async (req, res, next) => {
  // No-op for now
  sendSuccess(res, 200, "Quiz cancelled");
};

exports.retakeQuiz = async (req, res, next) => {
  // Reset quiz score in progress if needed
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) throw new AppError("Lesson not found", 404);

    const userProgress = await UserProgress.findOne({
      userId: req.user._id,
      languageId: lesson.preferredLanguage,
    });
    if (userProgress) {
      const lessonProgress = userProgress.completedLessons.find(
        (l) => l.lessonId.toString() === id,
      );
      if (lessonProgress) {
        lessonProgress.quizScore = undefined; // remove score
        await userProgress.save();
      }
    }
    sendSuccess(res, 200, "Quiz reset");
  } catch (error) {
    next(error);
  }
};

// controllers/progressController.js (partial)

exports.updateProgress = async (req, res, next) => {
  try {
    const { lessonId, sectionId, completed } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!lessonId || !sectionId) {
      throw new AppError("Missing lessonId or sectionId", 400);
    }
    if (completed !== true && completed !== false) {
      throw new AppError("Completed must be a boolean", 400);
    }

    // Only handle marking as completed (no un‑marking for now)
    if (completed !== true) {
      return sendSuccess(res, 200, "Progress update ignored (only marking completed is supported)");
    }

    // 1. Get lesson to find language
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError("Lesson not found", 404);
    const languageId = lesson.preferredLanguage; // adjust if field name differs

    // 2. Find or create user progress
    let progress = await UserProgress.findOne({ userId, languageId });
    if (!progress) {
      progress = new UserProgress({
        userId,
        languageId,
        overallLevel: lesson.level,
        currentLessonId: lessonId,
        completedSections: [],
        completedLessons: []
      });
      await progress.save();
    }

    // 3. Check if section already completed
    if (progress.completedSections.includes(sectionId)) {
      throw new AppError("Section already completed", 400);
    }

    // 4. Mark section as completed
    progress.completedSections.push(sectionId);

    // 5. Award XP (customise value as needed)
    progress.xp = (progress.xp || 0) + 10;

    // 6. Update streak
    const today = new Date().setHours(0, 0, 0, 0);
    const lastActivity = progress.lastActivityDate ? new Date(progress.lastActivityDate).setHours(0, 0, 0, 0) : null;
    if (lastActivity === today) {
      // already active today, streak unchanged
    } else if (lastActivity === today - 86400000) {
      progress.streak = (progress.streak || 0) + 1;
    } else {
      progress.streak = 1;
    }
    progress.lastActivityDate = new Date();

    // 7. Save progress
    await progress.save();

    // 8. Check if all sections of this lesson are completed
    const lessonWithSections = await Lesson.findById(lessonId).populate("sections");
    const allSectionsCompleted = lessonWithSections.sections.every(section =>
      progress.completedSections.some(completedId => completedId.toString() === section._id.toString())
    );

    // 9. Prepare response
    let quizUnlocked = false;
    if (allSectionsCompleted) {
      // Optionally unlock quiz (e.g., set a flag in progress or simply notify client)
      quizUnlocked = true;
    }

    sendSuccess(res, 200, "Progress updated", {
      progress: {
        xp: progress.xp,
        streak: progress.streak,
        completedSectionsCount: progress.completedSections.length,
        allSectionsCompleted,
        quizUnlocked
      }
    });
  } catch (error) {
    next(error);
  }
};

// controllers/progressController.js (partial)

exports.getCertificate = async (req, res, next) => {
  try {
    const { lessonId } = req.query;
    if (!lessonId) throw new AppError("Lesson ID is required", 400);

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError("Lesson not found", 404);

    // Find user progress for the language of this lesson
    const userProgress = await UserProgress.findOne({
      userId: req.user._id,
      languageId: lesson.preferredLanguage
    });

    if (!userProgress) {
      throw new AppError("No progress found for this language", 404);
    }

    // Check if the lesson is in the completedLessons array
    const lessonCompleted = userProgress.completedLessons.some(
      entry => entry.lessonId.toString() === lessonId
    );

    if (!lessonCompleted) {
      throw new AppError("Lesson not completed yet", 400);
    }

    // Optional: also check quiz score if needed (e.g., must have passed quiz)
    // For example, you could require quizScore >= passingScore from the lesson's quiz.

    // Generate certificate – this is a stub. In production, you'd generate a PDF.
    const certificateUrl = `/api/certificates/${req.user._id}/${lessonId}`; // example

    sendSuccess(res, 200, "Certificate generated", { url: certificateUrl });
  } catch (error) {
    next(error);
  }
};

exports.changeLanguage = async (req, res, next) => {
  try {
    const { languageId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError("User not found", 404);
    // Assuming User model has a 'preferredLanguage' field
    user.preferredLanguage = languageId;
    await user.save();
    sendSuccess(res, 200, "Language updated", {
      preferredLanguage: languageId,
    });
  } catch (error) {
    next(error);
  }
};

// controllers/lessonController.js (additions)

const { generateSections, generateQuiz } = require('../services/aiServices');

// Generate sections for a lesson (teacher only)
exports.generateSectionsForLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findOne({
      _id: id,
      teacher: req.user._id,
    })
      .populate("language", "name code")
      .populate("preferredLanguage","name code");
    if (!lesson) throw new AppError('Lesson not found or not yours', 404);

    const sections = await generateSections(lesson);
    // Return the generated sections as a draft; teacher will later update the lesson's sections array
    sendSuccess(res, 200, 'Sections generated', { lesson,sections });
  } catch (error) {
    next(error);
  }
};

// Generate quiz for a lesson (teacher only)
exports.generateQuizForLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findOne({ _id: id, teacher: req.user._id })
      .populate("language", "name code")
      .populate("preferredLanguage", "name code");
    if (!lesson) throw new AppError('Lesson not found or not yours', 404);

    const quiz = await generateQuiz(lesson);
    sendSuccess(res, 200, 'Quiz generated', { lesson,quiz });
  } catch (error) {
    next(error);
  }
};

// controllers/lessonController.js (add)
exports.updateQuizForLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, passingScore, questions } = req.body;

    const lesson = await Lesson.findOne({ _id: id, teacher: req.user._id });
    if (!lesson) throw new AppError('Lesson not found or not yours', 404);

    let quiz = await Quiz.findOne({ lessonId: id });
    if (!quiz) {
      quiz = new Quiz({ lessonId: id });
    }
    if (title) quiz.title = title;
    if (passingScore !== undefined) quiz.passingScore = passingScore;
    if (questions) quiz.questions = questions;
    await quiz.save();

    lesson.quiz = quiz._id;
    await lesson.save();

    sendSuccess(res, 200, 'Quiz updated', { quiz });
  } catch (error) {
    next(error);
  }
};