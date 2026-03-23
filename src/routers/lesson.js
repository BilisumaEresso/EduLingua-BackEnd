const express = require("express");
const isAuth = require("../middleware/isAuth");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const validate = require("../utils/validate");
const lessonValidator = require("../validations/lessonValidator");

const {
  getAllLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
} = require("../controllers/lesson");

const router = express.Router();

// Public routes
router.get("/", getAllLessons); // ?levelId=
router.get("/:id", getLesson);

// Protected routes
router.post(
  "/create",
  isAuth,
  isSuperAdmin,
  validate(lessonValidator),
  createLesson,
);
router.put(
  "/update/:id",
  isAuth,
  isSuperAdmin,
  validate(lessonValidator),
  updateLesson,
);
router.delete("/delete/:id", isAuth, isSuperAdmin, deleteLesson);

module.exports = router;
