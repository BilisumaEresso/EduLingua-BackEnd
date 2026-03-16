const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Added unique to prevent duplicate usernames
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3, // Corrected syntax
      maxlength: 30, // Corrected syntax
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
      // Note: Don't trim passwords, as spaces can be part of a secure pass
    },
    role: {
      type: String,
      required: true,
      default: "learner",
      enum: ["learner", "teacher", "admin"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // The user's primary/native tongue
    nativeLanguage: {
      type: String,
      default: "english",
      lowercase: true,
    },
    // User category for marketing/content tailoring
    accountType: {
      // Renamed from 'type' to avoid confusion with Mongoose reserved keywords
      type: String,
      default: "individual",
      enum: ["student", "enterprise", "individual"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
