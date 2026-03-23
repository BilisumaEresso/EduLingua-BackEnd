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
  saveQuiz
} = require("../controllers/quiz");

const router = express.Router();

// Public routes
router.get("/", getAllQuizzes); // optional ?lessonId=
router.get("/:id", getQuiz);
router.get("/:id/random", getRandomQuestions); // optional ?count=5

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
