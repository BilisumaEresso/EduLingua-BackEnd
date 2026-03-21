// controllers/admin.js
const { User, Lesson, Quiz, UserProgress, ChatSession } = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

// ------------------- Super‑Admin only -------------------

// Promote a user to admin
const promote = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user = await User.findById(id);
    if (!user) throw new AppError("User not found", 404);
    if (user.role === "admin")
      throw new AppError("User is already an admin", 400);
    if (user.role === "super-admin")
      throw new AppError("Cannot promote a super-admin", 401);

    user.role = "admin";
    user.promotedBy = req.user._id;
    await user.save();

    sendSuccess(res, 200, "User promoted to admin", { user });
  } catch (error) {
    next(error);
  }
};

// Demote an admin to learner
const demote = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user = await User.findById(id);
    if (!user) throw new AppError("User not found", 404);
    if (user.role === "super-admin")
      throw new AppError("Cannot demote a super-admin", 401);
    if (user.role !== "admin") throw new AppError("User is not an admin", 400);

    user.role = "learner";
    user.promotedBy = null;
    await user.save();

    sendSuccess(res, 200, "Admin demoted to learner", { user });
  } catch (error) {
    next(error);
  }
};

// Accept a teacher application (set role to teacher)
const acceptTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user = await User.findById(id);
    if (!user) throw new AppError("User not found", 404);
    if (!user.teacherRequested)
      throw new AppError("User has not applied to be a teacher", 400);
    if (user.role !== "learner")
      throw new AppError("Only learners can become teachers", 400);

    user.role = "teacher";
    user.accountType = "teacher";
    user.teacherRequested = false;
    await user.save();

    sendSuccess(res, 200, "Teacher application accepted", { user });
  } catch (error) {
    next(error);
  }
};

// Reject a teacher application (just clear the flag)
const rejectTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user = await User.findById(id);
    if (!user) throw new AppError("User not found", 404);
    if (!user.teacherRequested)
      throw new AppError("User has not applied to be a teacher", 400);

    user.teacherRequested = false;
    await user.save();

    sendSuccess(res, 200, "Teacher application rejected");
  } catch (error) {
    next(error);
  }
};

// Fire a teacher (demote to learner)
const fireTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user = await User.findById(id);
    if (!user) throw new AppError("User not found", 404);
    if (user.role !== "teacher")
      throw new AppError("User is not a teacher", 400);

    user.role = "learner";
    user.accountType = "individual"; // or keep as is
    user.teacherRequested = false;
    await user.save();

    sendSuccess(res, 200, "Teacher fired", { user });
  } catch (error) {
    next(error);
  }
};

// Shutdown system (super‑admin only)
let systemShutdown = false;
const shutdownSystem = async (req, res, next) => {
  try {
    systemShutdown = !systemShutdown;
    sendSuccess(
      res,
      200,
      `System ${systemShutdown ? "shut down" : "restarted"}`,
    );
  } catch (error) {
    next(error);
  }
};

// ------------------- Admin & Super‑Admin (shared) -------------------

// Get all users (with role‑based filter)
const getUsers = async (req, res, next) => {
  try {
    const currentUser = req.user;
    let roleFilter = {};
    if (currentUser.role === "admin") {
      roleFilter = { role: { $in: ["learner", "teacher"] } };
    } else if (currentUser.role === "super-admin") {
      // no filter
    } else {
      throw new AppError("Insufficient permissions", 403);
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const sortField = req.query.sort || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      User.countDocuments(roleFilter),
      User.find(roleFilter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .select("-password")
        .populate("promotedBy", "fullName email username")
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);
    sendSuccess(res, 200, "Users fetched", {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single user (with permission checks)
const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;
    const user = await User.findById(userId)
      .select("-password")
      .populate("promotedBy", "email username fullName");

    if (!user) throw new AppError("User not found", 404);

    // Super‑admin can see anyone; admin cannot see admin/super‑admin
    if (requestingUser.role !== "super-admin") {
      if (
        user.role === "super-admin" ||
        (user.role === "admin" && requestingUser.role === "admin")
      ) {
        throw new AppError("Unauthorized", 401);
      }
    }
    sendSuccess(res, 200, "User fetched", { user });
  } catch (error) {
    next(error);
  }
};

// Get all lessons (with pagination)
const getLessons = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const sortField = req.query.sort || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    const [total, lessons] = await Promise.all([
      Lesson.countDocuments(),
      Lesson.find()
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate("teacher", "fullName email username")
        .populate("sections")
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);
    sendSuccess(res, 200, "Lessons fetched", {
      lessons,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all quizzes (with pagination)
const getQuizzes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const sortField = req.query.sort || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    const [total, quizzes] = await Promise.all([
      Quiz.countDocuments(),
      Quiz.find()
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate("lessonId", "title")
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);
    sendSuccess(res, 200, "Quizzes fetched", {
      quizzes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ------------------- Dashboard Statistics -------------------

// Dashboard overview (super‑admin sees all, admin sees limited)
const getDashboardStats = async (req, res, next) => {
  try {
    const isSuper = req.user.role === "super-admin";

    // Common counts
    const [
      totalUsers,
      totalLessons,
      totalQuizzes,
      totalPremium,
      totalTeachers,
      totalLearners,
    ] = await Promise.all([
      User.countDocuments(),
      Lesson.countDocuments(),
      Quiz.countDocuments(),
      User.countDocuments({ isPremium: true }),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "learner" }),
    ]);

    // Super‑admin gets more details
    let stats = {
      totalUsers,
      totalLessons,
      totalQuizzes,
      totalPremium,
      totalTeachers,
      totalLearners,
    };

    if (isSuper) {
      // User growth (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const userGrowth = await User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Most popular languages (based on UserProgress)
      const popularLanguages = await UserProgress.aggregate([
        { $group: { _id: "$languageId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "languages",
            localField: "_id",
            foreignField: "_id",
            as: "language",
          },
        },
        { $unwind: "$language" },
        { $project: { name: "$language.name", count: 1 } },
      ]);

      // Top teachers (by number of lessons)
      const topTeachers = await Lesson.aggregate([
        { $group: { _id: "$teacher", lessonCount: { $sum: 1 } } },
        { $sort: { lessonCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "teacher",
          },
        },
        { $unwind: "$teacher" },
        {
          $project: {
            name: "$teacher.fullName",
            email: "$teacher.email",
            lessonCount: 1,
          },
        },
      ]);

      // Chat usage (total messages per day in last 7 days)
      const chatMessages = await ChatSession.aggregate([
        { $unwind: "$messages" },
        { $match: { "messages.timestamp": { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$messages.timestamp",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      stats = {
        ...stats,
        userGrowth,
        popularLanguages,
        topTeachers,
        chatMessages,
        // additional counts
        totalChatSessions: await ChatSession.countDocuments(),
        totalProgressRecords: await UserProgress.countDocuments(),
      };
    }

    sendSuccess(res, 200, "Dashboard stats", { stats });
  } catch (error) {
    next(error);
  }
};

// Export all functions
module.exports = {
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
};
