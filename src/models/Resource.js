const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["pdf", "link", "audio", "image"],
      required: true,
    },
    url: { type: String, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [String], // for search/filter
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ], // links resource to lessons
  },
  { timestamps: true },
);

const Resource = mongoose.model("Resource", resourceSchema);
module.exports = Resource;
