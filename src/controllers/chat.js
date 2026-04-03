// controllers/chat.js
const ChatSession = require("../models/ChatSession");
const User = require("../models/User");
const chatService = require("../services/chatService");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");
const eventBus = require("../utils/eventBus");

// 🔹 GET OR CREATE SESSION
exports.getMyChat = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const languageId = req.query.languageId || req.user.nativeLanguage?._id;

    if (!languageId) {
      throw new AppError("languageId is required", 400);
    }

    let session = await ChatSession.findOne({ userId, languageId });

    if (!session) {
      session = await ChatSession.create({
        userId,
        languageId,
      });
    }

    sendSuccess(res, 200, "Chat session fetched", { session });
  } catch (err) {
    next(err);
  }
};

// 🔹 SEND MESSAGE
exports.sendMessage = async (req, res, next) => {
  try {
    const user = req.user
    const payloadLanguageId = req.body.languageId;
    const message = req.body.message;
    const languageId = payloadLanguageId || req.user.nativeLanguage?._id;

    if (!languageId) {
      throw new AppError("languageId is required", 400);
    }

    if (!message) {
      throw new AppError("message is required", 400);
    }

    // 🔥 DAILY QUOTA RESET — if countResetsAt has passed, clear the counter
    if (user.countResetsAt && new Date() > new Date(user.countResetsAt)) {
      user.chatCount = 0;
      user.countResetsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // 🔥 LIMIT CHECK (premium users bypass)
    if (!user.isPremium && user.chatCount >= 30) {
      throw new AppError("Chat limit reached. Upgrade to premium.", 403);
    }

    // 🔹 find or create session (populate separately to avoid broken chain)
    const userId=user._id
    let session = await ChatSession.findOne({ userId, languageId }).populate(
      "languageId",
      "name code",
    );

    if (!session) {
      session = await ChatSession.create({ userId, languageId });
      await session.populate("languageId", "name code");
    }

    // 🔹 save user message
    session.messages.push({ sender: "user", text: message });

    // 🔹 AI response (model handles whether it's language-related or out of context)
    const aiReply = await chatService.generateReply(session, message, user);

    // 🔹 save AI message
    session.messages.push({ sender: "ai", text: aiReply });
    await session.save();

    // 🔹 increment usage and persist
    user.chatCount += 1;
    // Set reset window on first message of the day
    if (!user.countResetsAt || new Date() > new Date(user.countResetsAt)) {
      user.countResetsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      eventBus.emit('logActivity', {
        type: 'chat',
        action: 'CHAT_QUOTA_RESET',
        message: `Admin system allocated fresh daily chat quota for ${user.username}`,
        user: user._id
      });
    }
    await user.save();

    sendSuccess(res, 200, "Message sent", {
      reply: aiReply,
      chatCount: user.chatCount,
    });
  } catch (err) {
    next(err);
  }
};

// 🔹 UPDATE MEMORY
exports.updateMemory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { aiMemorySummary } = req.body;

    const session = await ChatSession.findById(id);
    if (!session) throw new AppError("Session not found", 404);

    session.aiMemorySummary = aiMemorySummary;
    await session.save();

    sendSuccess(res, 200, "Memory updated", { session });
  } catch (err) {
    next(err);
  }
};

// 🔹 DELETE SESSION
exports.deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await ChatSession.findByIdAndDelete(id);
    if (!session) throw new AppError("Session not found", 404);

    sendSuccess(res, 200, "Chat deleted");
  } catch (err) {
    next(err);
  }
};
