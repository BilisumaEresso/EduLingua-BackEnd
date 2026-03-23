const { Quiz, Lesson, Section } = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

// Get all quizzes (optionally filtered by lesson)
const getAllQuizzes = async (req, res, next) => {
  try {
    const { lessonId } = req.query;
    const filter = {};
    if (lessonId) filter.lesson = lessonId;

    const quizzes = await Quiz.find(filter).populate("lesson");
    sendSuccess(res, 200, "Quizzes fetched successfully", { quizzes });
  } catch (error) {
    next(error);
  }
};

// Get a single quiz by ID
const getQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate("lesson");
    if (!quiz) throw new AppError("Quiz not found", 404);
    sendSuccess(res, 200, "Quiz fetched successfully", { quiz });
  } catch (error) {
    next(error);
  }
};


const saveQuiz = async (req, res, next) => {
  try {
    const { lessonId, questions } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError("Lesson not found", 404);

    let quiz = await Quiz.findOne({ lesson: lessonId });

    if (!quiz) {
      quiz = new Quiz({
        lesson: lessonId,
        questionPool: questions,
      });
    } else {
      quiz.questionPool = questions;
    }

    await quiz.save();

    sendSuccess(res, 200, "Quiz saved successfully", { quiz });
  } catch (err) {
    next(err);
  }
};

// Create a new quiz
const createQuiz = async (req, res, next) => {
  try {
    const { lesson } = req.body;

    const lessonExists = await Lesson.findById(lesson);
    if (!lessonExists) throw new AppError("Lesson not found", 404);

    const existingQuiz = await Quiz.findOne({ lesson });
    if (existingQuiz)
      throw new AppError("Quiz already exists for this lesson", 400);

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

    // If lesson is being updated, check uniqueness
    if (
      updates.lesson &&
      updates.lesson.toString() !== quiz.lesson.toString()
    ) {
      const exists = await Quiz.findOne({ lesson: updates.lesson });
      if (exists)
        throw new AppError("Another quiz already exists for this lesson", 400);
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

module.exports = {
  getAllQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getRandomQuestions,
  saveQuiz
};
