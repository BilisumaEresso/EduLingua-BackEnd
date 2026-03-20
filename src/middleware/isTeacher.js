// middleware/isTeacher.js
const AppError = require("../utils/AppError");

const isTeacher = (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }
    if (req.user.role !== "teacher" && req.user.role !== "super-admin") {
      throw new AppError("Access denied. Teachers only.", 403);
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isTeacher;
