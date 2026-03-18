const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const AppError = require("../utils/AppError");
const { User } = require("../models");
const jwtKey = process.env.JWT_KEY;

const isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      throw new AppError("Access Denied, No Token Provided", 401);
    }
    const decoded = jwt.verify(
      token,
      jwtKey,
      { algorithms: ["HS256"] },
      (err, decoded) => {
        if (err) {
          // 403 if token is tampered with or expired
          throw new AppError("Invalid or Expired Token", 403);
        }
        return decoded;
      },
    );

    const { userId } = decoded;
    const userData = await User.findById(userId).select("-password -__v");
    req.user = userData;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isAuth;
