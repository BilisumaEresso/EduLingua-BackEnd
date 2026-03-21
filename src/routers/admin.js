// routes/adminRoutes.js
const express = require("express");
const isAuth = require("../middleware/isAuth");
const isAdmin = require("../middleware/isAdmin");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const {
  promote,
  demote,
  acceptTeacher,
  rejectTeacher,
  fireTeacher,
  shutdownSystem,
  getUsers,
  getUser,
  getLessons,
  getQuizzes,
  getDashboardStats,
} = require("../controllers/admin");

const router = express.Router();

// Super‑admin only
router.put("/promote/:id", isAuth, isSuperAdmin, promote);
router.put("/demote/:id", isAuth, isSuperAdmin, demote);
router.put("/accept-teacher/:id", isAuth, isSuperAdmin, acceptTeacher);
router.put("/reject-teacher/:id", isAuth, isSuperAdmin, rejectTeacher);
router.put("/fire-teacher/:id", isAuth, isSuperAdmin, fireTeacher);
router.put("/shut-system", isAuth, isSuperAdmin, shutdownSystem);

// Admin & Super‑admin (both can access)
router.get("/all-user", isAuth, isAdmin, getUsers);
router.get("/user/:id", isAuth, isAdmin, getUser);
router.get("/all-lesson", isAuth, isAdmin, getLessons);
router.get("/all-quiz", isAuth, isAdmin, getQuizzes);
router.get("/dashboard-stats", isAuth, isAdmin, getDashboardStats);

module.exports = router;
