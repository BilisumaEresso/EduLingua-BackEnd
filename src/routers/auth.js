const express = require("express");
const sendSuccess = require("../utils/sendSuccess");
const { signup, login, updateUser, changePassword, deleteUser } = require("../controllers/auth");
const isAuth = require("../middleware/isAuth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", isAuth, (req, res, next) => {
  try {
    sendSuccess(res, 200, "user data fetched successfully", { user: req.user });
  } catch (error) {
    next(error);
  }
});
router.put("/update",isAuth,updateUser);
router.put("/change-password",isAuth,changePassword);
router.delete("/delete", isAuth,deleteUser);

// TODO:Dont forget this on the last
router.put("/premium", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.post("/teacher/apply", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.post("/usubscribe", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});

module.exports = router;
