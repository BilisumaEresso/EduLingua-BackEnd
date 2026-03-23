const mongoose = require("mongoose");

const languageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // enforce uniqueness
      trim: true,
      index:true
    },

    nativeName: {
      type: String, // e.g. "አማርኛ"
      required: true,
    },

    code: {
      type: String,
      required: true,
      unique: true, // ISO-like code
      lowercase: true,
      trim: true,
      index:true
    },

    direction: {
      type: String,
      enum: ["ltr", "rtl"],
      default: "ltr",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    metadata: {
      flag: String, // optional (🇪🇹 etc or image URL)
      region: String, // e.g. "Ethiopia", "East Africa"
    },
  },
  { timestamps: true },
);


const Language = mongoose.model("Language", languageSchema);

module.exports = Language;
