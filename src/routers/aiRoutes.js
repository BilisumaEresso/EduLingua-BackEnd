// routes/aiRoutes.js
const express = require("express");
const isAuth = require("../middleware/isAuth");
const validate = require("../utils/validate");

const {
  generateSections,
  generateQuiz,

} = require("../controllers/aiController");

const {
  generateSectionSchema,
  generateQuizSchema,
} = require("../validations/aiValidations");

const router = express.Router();

// Protected routes
router.post(
  "/sections",
  isAuth,
  validate(generateSectionSchema),
  generateSections,
);
router.post("/quiz", isAuth, validate(generateQuizSchema), generateQuiz);
// router.post("/chat", isAuth, validate(chatSchema), chat);

module.exports = router;
