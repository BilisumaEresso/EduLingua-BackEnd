const { User, Lesson, Quiz } = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");
const promote = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user = await User.findById(id);
    if (!user) {
      throw new AppError("user not found ", 401);
    }
    if (user.role === "admin") {
      throw new AppError("user is already an admin", 400);
    }
    if (user.role === "super-admin") {
      throw new AppError("user is a super admin", 401);
    }
    user.role = "admin";
    user.promotedBy = req.user._id;

    await user.save();
    sendSuccess(res, 200, "user promoted to admin successfully", { user });
  } catch (error) {
    next(error);
  }
};
const demote = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user = await User.findById(id);
    if (!user) {
      throw new AppError("user not found ", 404);
    }
    if (user.role == "super-admin") {
      throw new AppError("user is super-admin", 401);
    }
    if (user.role !== "admin") {
      throw new AppError("user is not an admin", 400);
    }
    user.role = "learner";
    user.promotedBy = null;

    await user.save();
    sendSuccess(res, 200, "user demoted to student successfully", { user });
  } catch (error) {
    next(error);
  }
};

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
        .lean() // return plain JS objects (faster)
        .populate("lessonId"), // exclude sensitive fields
    ]);

    // 5. Pagination metadata
    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, 200, "data fetched successfully", {
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

const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("promotedBy", "email username fullName");

    if (!user) {
      throw new AppError("user not found", 404);
    }
    if (user.role == "super-admin") {
      throw new AppError("Unauthorized", 401);
    }
    if (user.role == "admin" && req.user.role == "admin") {
      throw new AppError("Unauthorized", 401);
    }
    sendSuccess(res, 200, "user data fetched successfully", { user });
  } catch (error) {
    next(error);
  }
};

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
        .lean() // return plain JS objects (faster)
        .populate("teacher", "fullName email username")
        .populate("sections"), // exclude sensitive fields
    ]);

    // 5. Pagination metadata
    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, 200, "data fetched successfully", {
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

const getUsers = async (req, res, next) => {
  try {
    const currentUser = req.user;

    let roleFilter = {};
    if (currentUser.role === "admin") {
      roleFilter = { role: { $in: ["learner", "teacher"] } };
    } else if (currentUser.role === "super-admin") {
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
        .lean() // return plain JS objects (faster)
        .select("-password")
        .populate("promotedBy", "fullName email username"), // exclude sensitive fields
    ]);

    // 5. Pagination metadata
    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, 200, "data fetched successfully", {
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

module.exports = { promote, demote, getUsers, getUser, getLessons,getQuizzes };
