const express = require("express");
const isAuth = require("../middleware/isAuth");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const validate = require("../utils/validate");
const levelValidator = require("../validations/levelValidator");

const {
  getAllLevels,
  getLevel,
  createLevel,
  updateLevel,
  deleteLevel,
} = require("../controllers/level");

const router = express.Router();

// Public routes
router.get("/", getAllLevels); // ?learningId=...
router.get("/:id", getLevel);

// Protected routes
router.post(
  "/create",
  isAuth,
  isSuperAdmin,
  validate(levelValidator),
  createLevel,
);
router.put(
  "/update/:id",
  isAuth,
  isSuperAdmin,
  validate(levelValidator),
  updateLevel,
);
router.delete("/delete/:id", isAuth, isSuperAdmin, deleteLevel);

module.exports = router;
