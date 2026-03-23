const authRoute = require("./auth");
const langRoute = require("./language");
const lessonRoute = require("./lesson");
const chatRoute = require("./chatSession");
const adminRoute = require("./admin");
const userProgressRoute = require("./userProgress");
const learningRoute = require("./learning");
const levelRoute = require("./level");
const sectionRoute = require("./section");
const quizRoute = require("./quiz");
const aiRoute=require("./aiRoutes")

module.exports = {
  authRoute,
  langRoute,
  lessonRoute,
  chatRoute,
  adminRoute,
  userProgressRoute,
  learningRoute,
  levelRoute,
  sectionRoute,
  quizRoute,
  aiRoute
};
