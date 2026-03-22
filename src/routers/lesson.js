// routes/lessonRoutes.js
const express = require("express");
const router = express.Router();
const {
  addLesson,
  updateLesson,
  deleteLesson,
  getMyLessons,
  getLessonById,
  addSection,
  updateSection,
  deleteSection,
  getSectionsByLesson,
  addResource,
  updateResource,
  deleteResource,
  getResourcesBySection,
  getResourceById,
  addQuiz,
  getQuizByLesson,
  updateQuiz,
  deleteQuiz,
  getAllLessonsForStudent,
  getLessonForStudent,
  startLesson,
  finishLesson,
  cancelLesson,
  retakeLesson,
  takeQuiz,
  cancelQuiz,
  retakeQuiz,
  updateProgress,
  getCertificate,
  changeLanguage,
  finishSection,
  updateQuizForLesson,
  generateQuizForLesson,
  generateSectionsForLesson,
} = require("../controllers/lesson");
const isAuth = require("../middleware/isAuth");
const isTeacher = require("../middleware/isTeacher");
const validate = require("../utils/validate");

// Joi schemas (import or define here)
const {
  addLessonSchema,
  updateLessonSchema,
  addSectionSchema,
  updateSectionSchema,
  addResourceSchema,
  updateResourceSchema,
  addQuizSchema,
  updateQuizSchema,
  takeQuizSchema,
  updateProgressSchema,
  changeLanguageSchema,
  paginationSchema,
} = require("../validations/lessonValidations");

// All routes require authentication
router.use(isAuth);

// ----- Lessons (Teacher only) -----
router.post("/add", isTeacher, validate(addLessonSchema), addLesson);
router.put(
  "/update/:id",
  isTeacher,
  validate(updateLessonSchema),
  updateLesson,
);
router.delete("/delete/:id", isTeacher, deleteLesson);
router.get(
  "/my-lessons",
  isTeacher,
  validate(paginationSchema, "query"),
  getMyLessons,
);
router.get("/my-lessons/:id", isTeacher, getLessonById);

// ----- Sections -----
router.post("/section/add", isTeacher, validate(addSectionSchema), addSection);
router.put(
  "/section/update/:id",
  isTeacher,
  validate(updateSectionSchema),
  updateSection,
);
router.delete("/section/delete/:id", isTeacher, deleteSection);
router.get("/:id/section", getSectionsByLesson); // public (students can view)
// routes/lessonRoutes.js (add these lines)
router.post('/:id/generate-sections', isTeacher, generateSectionsForLesson);
router.post('/:id/generate-quiz', isTeacher, generateQuizForLesson);

// ----- Resources -----
router.post(
  "/section/:id/resource/add",
  isTeacher,
  validate(addResourceSchema),
  addResource,
);
router.put(
  "/section/resource/update/:id",
  isTeacher,
  validate(updateResourceSchema),
  updateResource,
);
router.delete("/section/resource/delete/:id", isTeacher, deleteResource);
router.get("/section/:id/resource/get", getResourcesBySection);
router.get("/section/resource/get/:id", getResourceById); // note: param conflict, adjust if needed

// ----- Quizzes -----
router.post("/quiz/add", isTeacher, validate(addQuizSchema), addQuiz);
router.get("/:id/quiz", getQuizByLesson);
router.put(
  "/quiz/update/:id",
  isTeacher,
  validate(updateQuizSchema),
  updateQuiz,
);
router.put("/:id/quiz", isTeacher,updateQuizForLesson);
router.delete("/quiz/delete/:id", isTeacher, deleteQuiz);

// ----- Student endpoints -----
router.get("/get", getAllLessonsForStudent);
router.get("/get/:id", getLessonForStudent);
router.post("/:id/start", startLesson);
router.put("/:id/finish", finishLesson);
router.put("/:id/cancel", cancelLesson);
router.put("/:id/retake", retakeLesson);
router.post("/section/finish", isAuth, finishSection);
router.post("/quiz/:id/take",isAuth, validate(takeQuizSchema), takeQuiz);
router.put("/quiz/:id/cancel",isAuth, cancelQuiz);
router.put("/quiz/:id/retake", retakeQuiz);
router.put("/update-progress",isAuth, validate(updateProgressSchema), updateProgress);
router.get("/certificate", isAuth, getCertificate);
router.put("/lang", validate(changeLanguageSchema), changeLanguage);

module.exports = router;
