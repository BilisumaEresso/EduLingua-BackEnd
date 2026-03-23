const { User } = require("../models");
const AppError = require("../utils/AppError");
const hashPassword = require("../utils/hashPassword");
const comparePassword = require("../utils/comparePassword");
const sendSuccess = require("../utils/sendSuccess");
const generateToken = require("../utils/generateToken");

// SIGNUP
const signup = async (req, res, next) => {
  try {
    const { email, username, fullName, password, nativeLanguage } = req.body;

    // Check for existing email or username
    const [emailExist, userNameExist] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ username }),
    ]);
    if (emailExist) throw new AppError("Email already exists", 400);
    if (userNameExist) throw new AppError("Username already exists", 400);

    const hashedPassword = await hashPassword(password);
    let user = new User({
      email,
      username,
      fullName,
      password: hashedPassword,
      nativeLanguage,
    });
    await user.save();

    const token = await generateToken(user);
    user = user.toObject();
    delete user.password;

    sendSuccess(res, 201, "User registered successfully", { user, token });
  } catch (err) {
    next(err);
  }
};

// LOGIN
const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    let user;

    if (email) user = await User.findOne({ email });
    else if (username) user = await User.findOne({ username });

    if (!user) throw new AppError("Invalid credentials", 400);

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new AppError("Incorrect password", 400);

    user = user.toObject();
    delete user.password;
    const token = await generateToken(user);

    sendSuccess(res, 200, "User logged in successfully", { user, token });
  } catch (error) {
    next(error);
  }
};

// UPDATE USER
const updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    const userId = req.user._id;

    delete updates.password; // cannot update password here
    delete updates.role; // cannot change role

    // Check uniqueness
    if (updates.email) {
      const existingEmail = await User.findOne({
        email: updates.email,
        _id: { $ne: userId },
      });
      if (existingEmail) throw new AppError("Email already in use", 400);
    }
    if (updates.username) {
      const existingUsername = await User.findOne({
        username: updates.username,
        _id: { $ne: userId },
      });
      if (existingUsername) throw new AppError("Username already taken", 400);
    }

    let user = await User.findById(userId).select("-password");
    if (!user) throw new AppError("User not found", 404);

    user.set(updates);
    await user.save();

    const token = await generateToken(user);
    sendSuccess(res, 200, "User updated successfully", { user, token });
  } catch (error) {
    next(error);
  }
};

// CHANGE PASSWORD
const changePassword = async (req, res, next) => {
  try {
    const { password, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError("User not found", 404);

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new AppError("Incorrect password", 400);

    user.password = await hashPassword(newPassword);
    await user.save();

    sendSuccess(res, 200, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

// DELETE USER (hard delete)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) throw new AppError("User not found", 404);
    sendSuccess(res, 200, "User account deleted");
  } catch (error) {
    next(error);
  }
};

// UPGRADE TO PREMIUM
const upgradeToPremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError("User not found", 404);
    if (user.isPremium) throw new AppError("Already a premium user", 400);

    user.isPremium = true;
    user.chatCount = 0;
    user.countResetsAt = new Date();
    await user.save();

    sendSuccess(res, 200, "Premium upgrade successful", { isPremium: true });
  } catch (error) {
    next(error);
  }
};

// APPLY FOR TEACHER
const applyForTeacher = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError("User not found", 404);
    if (user.role !== "learner")
      throw new AppError("Only learners can apply", 403);
    if (user.teacherRequested)
      throw new AppError("Application already pending", 400);

    user.teacherRequested = true;
    await user.save();

    sendSuccess(res, 200, "Teacher application submitted");
  } catch (error) {
    next(error);
  }
};

// UNSUBSCRIBE PREMIUM
const unsubscribePremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError("User not found", 404);
    if (!user.isPremium) throw new AppError("Not a premium user", 400);

    user.isPremium = false;
    await user.save();

    sendSuccess(res, 200, "Premium subscription cancelled");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  updateUser,
  changePassword,
  deleteUser,
  upgradeToPremium,
  applyForTeacher,
  unsubscribePremium,
};
