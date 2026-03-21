// routes/authRoutes.js
const express = require("express");
const sendSuccess = require("../utils/sendSuccess");
const {
  signup,
  login,
  updateUser,
  changePassword,
  deleteUser,
  upgradeToPremium,
  applyForTeacher,
  unsubscribePremium,
} = require("../controllers/auth");
const isAuth = require("../middleware/isAuth");
const validate = require("../utils/validate");
const {
  signupSchema,
  loginSchema,
  updateUserSchema,
  changePasswordSchema,
  premiumSchema,
  teacherApplySchema,
  unsubscribeSchema,
} = require("../validations/authValidations");

const router = express.Router();

// Public routes
router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);

// Protected routes
router.get("/me", isAuth, (req, res, next) => {
  try {
    sendSuccess(res, 200, "User data fetched successfully", { user: req.user });
  } catch (error) {
    next(error);
  }
});
router.put("/update", isAuth, validate(updateUserSchema), updateUser);
router.put(
  "/change-password",
  isAuth,
  validate(changePasswordSchema),
  changePassword,
);
router.delete("/delete", isAuth, deleteUser);

// New endpoints
router.put("/premium", isAuth, validate(premiumSchema), upgradeToPremium);
router.post(
  "/teacher/apply",
  isAuth,
  validate(teacherApplySchema),
  applyForTeacher,
);
router.post(
  "/unsubscribe",
  isAuth,
  validate(unsubscribeSchema),
  unsubscribePremium,
);

module.exports = router;
