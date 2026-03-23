const express = require("express");
const validate = require("../utils/validate");
const languageValidator = require("../validations/languageValidator");
const sendSuccess = require("../utils/sendSuccess");

const {
  addLang,
  updateLang,
  getAllLang,
  getLang,
  deleteLang,
} = require("../controllers/language");

const isAuth = require("../middleware/isAuth");
const isSuperAdmin = require("../middleware/isSuperAdmin");

const router = express.Router();

// Add a language (super admin only)
router.post("/add", isAuth, isSuperAdmin, validate(languageValidator), addLang);

// Get all languages (public)
router.get("/", getAllLang);

// Get a single language by ID (public)
router.get("/:id", getLang);

// Update a language (super admin only)
router.put(
  "/update/:id",
  isAuth,
  isSuperAdmin,
  validate(languageValidator),
  updateLang,
);

// Soft delete a language (super admin only)
router.delete("/delete/:id", isAuth, isSuperAdmin, deleteLang);

module.exports = router;
