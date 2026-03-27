// routes/chatRoutes.js
const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/isAuth");
const validate = require("../utils/validate");

const {
  getMyChat,
  sendMessage,
  updateMemory,
  deleteSession,
} = require("../controllers/chat");

const {
  sendMessageSchema,
  updateMemorySchema,
} = require("../validations/chatValidations");

// 🔹 get or create session
router.get("/my-chat", isAuth, getMyChat);

// 🔹 send message
router.post("/send", isAuth, validate(sendMessageSchema), sendMessage);

// 🔹 update AI memory
router.put("/update/:id", isAuth, validate(updateMemorySchema), updateMemory);

// 🔹 delete session
router.delete("/delete/:id", isAuth, deleteSession);

module.exports = router;
