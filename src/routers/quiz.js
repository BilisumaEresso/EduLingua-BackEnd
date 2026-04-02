const express = require("express");
const isAuth = require("../middleware/isAuth");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const validate = require("../utils/validate");
const quizValidator = require("../validations/quizValidator");

const {
  getAllQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getRandomQuestions,
  saveQuiz,getRandomQuestionsByLevel
} = require("../controllers/quiz");

const router = express.Router();

// Public routes
router.get("/", getAllQuizzes); // optional ?levelId=
router.get("/level/:levelId/random", getRandomQuestionsByLevel); // by level ID
router.get("/:id", getQuiz);
router.get("/:id/random", getRandomQuestions); // by quiz ID

// Protected routes
router.post(
  "/create",
  isAuth,
  isSuperAdmin,
  validate(quizValidator),
  createQuiz,
);
router.post("/save", isAuth, validate(quizValidator), saveQuiz);
router.put(
  "/update/:id",
  isAuth,
  isSuperAdmin,
  validate(quizValidator),
  updateQuiz,
);
router.delete("/delete/:id", isAuth, isSuperAdmin, deleteQuiz);

module.exports = router;
