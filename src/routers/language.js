const express = require("express");
const sendSuccess = require("../utils/sendSuccess");
const {
  getAllLang,
  addLang,
  getLang,
  updateLang,
  deleteLang,
} = require("../controllers/language");
const isAuth = require("../middleware/isAuth");
const isSuperAdmin = require("../middleware/isSuperAdmin");

const router = express.Router();

router.post("/add", isAuth, isSuperAdmin, addLang);
router.get("/:code", getLang);
router.get("/", getAllLang);
router.put("/update/:code", isAuth, isSuperAdmin, updateLang); // path parameter: language code to update
router.delete("/delete/:code", isAuth, isSuperAdmin, deleteLang); // path parameter: language code to delete

module.exports = router;
