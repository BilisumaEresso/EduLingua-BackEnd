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
    const { language, preferedLanguage, level, title, desc } = req.body;
    const teacher = req.user._id;

    // Verify languages exist
    const [lang, prefLang] = await Promise.all([
      Language.findById(language),
      Language.findById(preferedLanguage),
    ]);
    if (!lang || !prefLang) throw new AppError("Invalid language(s)", 400);

    // Determine sequence order for this teacher
    const count = await Lesson.countDocuments({ teacher });
    const sequenceOrder = count + 1;

    const lesson = new Lesson({
      langauge: language, // note: field name in schema is "langauge" (typo)
      preferedLanguage,
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
      lesson.langauge = updates.language;
    }
    if (updates.preferedLanguage) {
      const prefLang = await Language.findById(updates.preferedLanguage);
      if (!prefLang) throw new AppError("Invalid preferred language", 400);
      lesson.preferedLanguage = updates.preferedLanguage;
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
      .populate("langauge preferedLanguage", "name code")
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
      .populate("langauge preferedLanguage", "name code")
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

exports.addSection = async (req, res, next) => {
  try {
    const { lessonId, order, contentBlocks, resourceIds } = req.body;
    const lesson = await Lesson.findOne({
      _id: lessonId,
      teacher: req.user._id,
    });
    if (!lesson) throw new AppError("Lesson not found or not yours", 404);

    // Create section
    const section = new Section({
      lesson: lessonId,
      order: order || 0,
      ContentBlocks: contentBlocks || [],
      resource: resourceIds || [],
    });
    await section.save();

    // Add section to lesson's sections array
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
    const updates = req.body;
    const section = await Section.findById(id).populate("lesson");
    if (!section) throw new AppError("Section not found", 404);
    const lesson = await Lesson.findOne({
      _id: section.lesson,
      teacher: req.user._id,
    });
    if (!lesson) throw new AppError("Not authorized", 403);

    // Update fields
    if (updates.order !== undefined) section.order = updates.order;
    if (updates.contentBlocks) section.ContentBlocks = updates.contentBlocks;
    if (updates.resourceIds) section.resource = updates.resourceIds;
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
    const lesson = await Lesson.findOne({
      _id: section.lesson,
      teacher: req.user._id,
    });
    if (!lesson) throw new AppError("Not authorized", 403);

    // Remove section from lesson's sections array
    lesson.sections.pull(section._id);
    await lesson.save();

    // Optionally delete associated resources
    await Resource.deleteMany({ _id: { $in: section.resource } });
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
    if (languageId) filter.preferedLanguage = languageId;

    const lessons = await Lesson.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("langauge preferedLanguage", "name code")
      .populate("teacher", "name")
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
      .populate("langauge preferedLanguage", "name code")
      .populate("teacher", "name")
      .populate({
        path: "sections",
        populate: { path: "resource" },
      })
      .lean();
    if (!lesson) throw new AppError("Lesson not found", 404);

    // Optionally get user's progress for this lesson (if we have a progress model)
    // Using UserProgress model: find progress for this language (lesson.preferedLanguage)
    let progress = null;
    if (req.user) {
      const userProgress = await UserProgress.findOne({
        userId: req.user._id,
        languageId: lesson.preferedLanguage,
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
      languageId: lesson.preferedLanguage,
    });
    if (!userProgress) {
      userProgress = new UserProgress({
        userId: req.user._id,
        languageId: lesson.preferedLanguage,
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
      languageId: lesson.preferedLanguage,
    });
    if (!userProgress) {
      userProgress = new UserProgress({
        userId: req.user._id,
        languageId: lesson.preferedLanguage,
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
      languageId: lesson.preferedLanguage,
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
      languageId: lesson.preferedLanguage,
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
      languageId: lesson.preferedLanguage,
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
      languageId: lesson.preferedLanguage,
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

exports.updateProgress = async (req, res, next) => {
  try {
    const { lessonId, sectionId, completed } = req.body;
    // For now, we don't store section completion in UserProgress. Could add a field.
    sendSuccess(res, 200, "Progress updated (stub)");
  } catch (error) {
    next(error);
  }
};

exports.getCertificate = async (req, res, next) => {
  try {
    const { lessonId } = req.query;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError("Lesson not found", 404);

    const userProgress = await UserProgress.findOne({
      userId: req.user._id,
      languageId: lesson.preferedLanguage,
    });
    const completed = userProgress?.completedLessons.some(
      (l) => l.lessonId.toString() === lessonId,
    );
    if (!completed) throw new AppError("Lesson not completed", 400);

    // Generate certificate (stub)
    sendSuccess(res, 200, "Certificate generated", {
      url: `/certificates/${req.user._id}/${lessonId}`,
    });
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
