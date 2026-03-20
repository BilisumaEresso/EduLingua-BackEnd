const express = require("express");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const isAdmin = require("../middleware/isAdmin");
const { promote, demote, getUsers, getUser, getLessons, getQuizzes } = require("../controllers/admin");
const isAuth = require("../middleware/isAuth");
const sendSuccess = require("../utils/sendSuccess");

const router = express.Router();

// super Admin
router.put("/promote/:id", isAuth, isSuperAdmin, promote);
router.put("/demote/:id", isAuth, isSuperAdmin, demote);
router.put("/shut-system", isAuth, isSuperAdmin, (req, res, next) => {
  try {
    sendSuccess(res, 200, "not implemented yet");
  } catch (error) {
    next(error);
  }
});

// admins
router.get("/all-user", isAuth,isAdmin, getUsers);
router.get("/user/:id", isAuth, getUser);
router.get("/all-lesson", isAuth, getLessons);
router.get("/all-quiz", isAuth, getQuizzes);
// router.get("/ai-usage", isAuth, promote);  // TODO: this is for later
router.put("/accept-teacher/:id", isAuth, promote);
router.put("/reject-teacher/:id", isAuth, promote);
router.put("/fire-teacher/:id", isAuth, promote);


module.exports = router;
