const mongoose = require("mongoose");

const systemSchema = new mongoose.Schema(
  {
    configKey: { type: String, default: "global_settings", unique: true },

    // 1. Availability Control
    isRunning: { type: Boolean, default: true },
    status: {
      type: String,
      default: "active",
      enum: ["active", "stopped", "maintenance", "under development"],
    },

    // 2. Global Alerts (For all users)
    // This is where you store "System Info" or "Maintenance Warnings"
    globalAlerts: [
      {
        title: String,
        message: String,
        severity: {
          type: String,
          enum: ["info", "warning", "critical"],
          default: "info",
        },
        isActive: { type: Boolean, default: true },
        expiryDate: Date, // Automatically hide alert after this date
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // 3. New User Onboarding Alert
    // This triggers specifically for users who just signed up
    newUserWelcomeAlert: {
      title: { type: String, default: "Welcome to the App!" },
      message: {
        type: String,
        default: "Check out our new AI tutor features.",
      },
      isAutoEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);
 const System = mongoose.model("System", systemSchema);

module.exports = System;