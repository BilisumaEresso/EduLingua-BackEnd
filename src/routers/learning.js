const express = require("express");
const isAuth = require("../middleware/isAuth");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const validate = require("../utils/validate");
const learningValidator = require("../validations/learningValidator");

const {
  getAllLearnings,
  getLearning,
  createLearning,
  updateLearning,
  deleteLearning,
} = require("../controllers/learning");

const router = express.Router();

// Public routes
router.get("/", getAllLearnings);
router.get("/:id", getLearning);

// Protected routes
router.post(
  "/create",
  isAuth,
  isSuperAdmin,
  validate(learningValidator),
  createLearning,
);
router.put(
  "/update/:id",
  isAuth,
  isSuperAdmin,
  updateLearning,
);
router.delete("/delete/:id", isAuth, isSuperAdmin, deleteLearning);

module.exports = router;
