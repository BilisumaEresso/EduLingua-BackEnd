const { Quiz, Lesson, Level, Section } = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

// Get all quizzes (optionally filtered by level)
const getAllQuizzes = async (req, res, next) => {
  try {
    const { levelId } = req.query;
    const filter = {};
    if (levelId) filter.level = levelId;

    const quizzes = await Quiz.find(filter).populate("level");
    sendSuccess(res, 200, "Quizzes fetched successfully", { quizzes });
  } catch (error) {
    next(error);
  }
};

// Get a single quiz by ID
const getQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate("level");
    if (!quiz) throw new AppError("Quiz not found", 404);
    sendSuccess(res, 200, "Quiz fetched successfully", { quiz });
  } catch (error) {
    next(error);
  }
};

const saveQuiz = async (req, res, next) => {
  try {
    const { lessonId, levelId: providedLevelId, level: providedLevel, questions, questionPool, append = true } = req.body;

    let levelId = providedLevelId || providedLevel;
    const incomingQuestions = questions || questionPool || [];

    if (lessonId) {
      const lesson = await Lesson.findById(lessonId).populate("level");
      if (!lesson) throw new AppError("Lesson not found", 404);
      levelId = lesson.level._id || lesson.level;
    }

    if (!levelId) throw new AppError("Level ID or Lesson ID is required", 400);

    // Correctly find or create the quiz for this level
    let quiz = await Quiz.findOne({ level: levelId });

    const formattedQuestions = incomingQuestions.map(q => ({
      ...q,
      lesson: q.lesson || lessonId,
      isAiGenerated: q.isAiGenerated ?? true
    }));

    if (!quiz) {
      const levelDoc = await Level.findById(levelId);
      quiz = new Quiz({
        level: levelId,
        questionPool: formattedQuestions,
        title: levelDoc ? `${levelDoc.title} Quiz Pool` : "Level Quiz Pool"
      });
    } else {
      if (append) {
        quiz.questionPool.push(...formattedQuestions);
      } else {
        quiz.questionPool = formattedQuestions;
      }
    }

    await quiz.save();

    sendSuccess(res, 200, "Quiz questions saved to level pool successfully", {
      quizId: quiz._id,
      levelId: quiz.level,
      poolSize: quiz.questionPool.length
    });
  } catch (err) {
    next(err);
  }
};

// Create a new quiz
const createQuiz = async (req, res, next) => {
  try {
    const { level } = req.body;

    const levelExists = await Level.findById(level);
    if (!levelExists) throw new AppError("Level not found", 404);

    const existingQuiz = await Quiz.findOne({ level });
    if (existingQuiz)
      throw new AppError("Quiz already exists for this level", 400);

    const quiz = await Quiz.create(req.body);
    sendSuccess(res, 201, "Quiz created successfully", { quiz });
  } catch (error) {
    next(error);
  }
};

// Update a quiz
const updateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) throw new AppError("Quiz not found", 404);

    // If level is being updated, check uniqueness
    if (updates.level && updates.level.toString() !== quiz.level.toString()) {
      const exists = await Quiz.findOne({ level: updates.level });
      if (exists)
        throw new AppError("Another quiz already exists for this level", 400);
    }

    quiz.set(updates);
    await quiz.save();

    sendSuccess(res, 200, "Quiz updated successfully", { quiz });
  } catch (error) {
    next(error);
  }
};

// Delete a quiz (hard delete)
const deleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndDelete(id);
    if (!quiz) throw new AppError("Quiz not found", 404);

    sendSuccess(res, 200, "Quiz deleted successfully");
  } catch (error) {
    next(error);
  }
};

// Get randomized questions from a quiz
const getRandomQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { count = 10 } = req.query;

    const quiz = await Quiz.findById(id);
    if (!quiz) throw new AppError("Quiz not found", 404);

    const questions = quiz.getRandomQuestions(Number(count));
    sendSuccess(res, 200, "Randomized questions fetched successfully", {
      questions,
    });
  } catch (error) {
    next(error);
  }
};

// Get randomized questions by Level ID
const getRandomQuestionsByLevel = async (req, res, next) => {
  try {
    const { levelId } = req.params;
    const { count = 10 } = req.query;

    const quiz = await Quiz.findOne({ level: levelId });
    if (!quiz) {
       // If no quiz exists for this level, return empty or sensible error
       return sendSuccess(res, 200, "No quiz pool found for this level", {
         questions: []
       });
    }

    const questions = quiz.getRandomQuestions(Number(count));
    sendSuccess(res, 200, "Randomized level questions fetched successfully", {
      questions,
      totalPool: quiz.questionPool.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getRandomQuestions,
  getRandomQuestionsByLevel,
  saveQuiz,
};
