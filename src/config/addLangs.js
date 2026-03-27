const mongoose = require("mongoose");
const {Language} = require("../models"); // adjust path

const languages = [
  {
    name: "English",
    nativeName: "English",
    code: "en",
    direction: "ltr",
    isActive: true,
    metadata: {
      flag: "🇬🇧",
      region: "United Kingdom",
    },
  },
  {
    name: "French",
    nativeName: "Français",
    code: "fr",
    direction: "ltr",
    isActive: true,
    metadata: {
      flag: "🇫🇷",
      region: "France",
    },
  },
  {
    name: "Japanese",
    nativeName: "日本語",
    code: "ja",
    direction: "ltr",
    isActive: true,
    metadata: {
      flag: "🇯🇵",
      region: "Japan",
    },
  },
  {
    name: "German",
    nativeName: "Deutsch",
    code: "de",
    direction: "ltr",
    isActive: true,
    metadata: {
      flag: "🇩🇪",
      region: "Germany",
    },
  },
];

async function seedLanguages() {
  try {
    await Language.insertMany(languages);
    console.log("✅ Languages seeded successfully!");
  } catch (err) {
    console.error("❌ Error seeding languages:", err);
  }
}

module.exports=seedLanguages
