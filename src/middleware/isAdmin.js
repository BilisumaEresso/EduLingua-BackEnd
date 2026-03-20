const AppError = require("../utils/AppError");

const isAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user === "admin" || !user === "super-admin") {
      throw new AppError("Unauthorized");
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isAdmin;
