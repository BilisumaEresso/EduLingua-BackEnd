const express = require("express");
const isAuth = require("../middleware/isAuth");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const validate = require("../utils/validate");
const {sectionValidator,bulkSectionSchema} = require("../validations/sectionValidator");

const {
  getAllSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  createSectionsBulk,
} = require("../controllers/section");

const router = express.Router();

// Public routes
router.get("/", getAllSections); // optional ?lessonId=
router.get("/:id", getSection);

// Protected routes
router.post(
  "/create",
  isAuth,
  isSuperAdmin,
  validate(sectionValidator),
  createSection,
);
router.post(
  "/bulk",
  isAuth,
  isSuperAdmin,
  validate(bulkSectionSchema),
  createSectionsBulk,
);

router.put(
  "/update/:id",
  isAuth,
  isSuperAdmin,
  updateSection,
);
router.delete("/delete/:id", isAuth, isSuperAdmin, deleteSection);

module.exports = router;
