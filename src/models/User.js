const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: "learner",
      enum: ["learner", "teacher", "admin", "super-admin"],
    },
    promotedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    // AI chat quota
    chatCount: { type: Number, default: 0 },
    countResetsAt: { type: Date },
    nativeLanguage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },
    teacherRequested: { type: Boolean, default: false },
    accountType: {
      type: String,
      default: "individual",
      enum: ["student", "enterprise", "individual", "teacher"],
    },
    progress: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserProgress",
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
