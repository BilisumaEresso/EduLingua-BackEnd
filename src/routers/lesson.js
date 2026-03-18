const express = require("express");
const sendSuccess = require("../utils/sendSuccess");

const router = express.Router();

// lessons
router.post("/add", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.put("/update", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.delete("/delete", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.get("/my-lessons", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.get("/my-lessons/:id", (req, res, next) => {
  //id = lesson id
  sendSuccess(res, 200, "this is success");
});

// sections under lessons
router.post("/section/add", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.put("/section/update/:id", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.get("/:id/section", (req, res, next) => {
  //id = lessons id this used for getting all sections under a lesson
  sendSuccess(res, 200, "this is success");
});
router.delete("/section/delete/:id", (req, res, next) => {
  //id = section id this used for getting a section
  sendSuccess(res, 200, "this is success");
});
router.post("/section/:id/resource/add", (req, res, next) => {
  //id = section id this used for adding resource to a section
  sendSuccess(res, 200, "this is success");
});
router.get("/section/:id/resource/get", (req, res, next) => {
  //id = section id this used for getting a section
  sendSuccess(res, 200, "this is success");
});
router.get("/section/:id/resource/get/:id", (req, res, next) => {
  //id = section id this used for getting a section
  sendSuccess(res, 200, "this is success");
});
router.put("/section/resource/update/:id", (req, res, next) => {
  //id = section id this used for getting a section
  sendSuccess(res, 200, "this is success");
});
router.delete("/section/resource/delete/:id", (req, res, next) => {
  //id = section id this used for getting a section
  sendSuccess(res, 200, "this is success");
});

// Quizzes routers under lessons

router.post("/quiz/add", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.get(":id/quiz/", (req, res, next) => {
  // get quiz for id = lesson
  sendSuccess(res, 200, "this is success");
});
router.put("/quiz/update/:id", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.delete("/quiz/delete/:id", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});

// students
router.get("/get", (req, res, next) => {
  //get  all lessons
  sendSuccess(res, 200, "this is success");
});
router.post("/get/:id", (req, res, next) => {
  //id= lesson ,student gets a lesson
  sendSuccess(res, 200, "this is success");
});
router.post("/:id/start", (req, res, next) => {
  //id= lesson ,student starts a lesson
  sendSuccess(res, 200, "this is success");
});
router.put("/:id/finish", (req, res, next) => {
  //id= lesson ,student finishes a lesson
  sendSuccess(res, 200, "this is success");
});
router.put("/:id/cancel", (req, res, next) => {
  //id= lesson ,student cancels a lesson
  sendSuccess(res, 200, "this is success");
});
router.put("/lang", (req, res, next) => {
  //change the language
  sendSuccess(res, 200, "this is success");
});
router.put("/:id/retake", (req, res, next) => {
  //id= lesson ,student retakes a lesson
  sendSuccess(res, 200, "this is success");
});
router.put("/quiz/:id/take", (req, res, next) => {
  //id= lesson ,student retakes a lesson
  sendSuccess(res, 200, "this is success");
});
router.put("/quiz/:id/cancel", (req, res, next) => {
  //id= lesson ,student retakes a lesson
  sendSuccess(res, 200, "this is success");
});
router.put("/quiz/:id/retake", (req, res, next) => {
  //id= lesson ,student retakes a lesson
  sendSuccess(res, 200, "this is success");
});
router.put("/update-progress", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});
router.get("/certificate", (req, res, next) => {
  sendSuccess(res, 200, "this is success");
});

module.exports = router;
