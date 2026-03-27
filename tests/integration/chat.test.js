// Mock the AI service so tests don't make real HTTP calls
jest.mock("../../src/services/chatService", () => ({
  generateReply: jest.fn().mockResolvedValue("Mock AI reply"),
}));

const request = require("supertest");
const app = require("../../app");
const { ChatSession, User } = require("../../src/models");
const { createLanguage, createUser, tokenFor } = require("../helpers");

describe("Chat API", () => {
  let user, language, token;

  beforeEach(async () => {
    language = await createLanguage();
    user = await createUser(language);
    token = tokenFor(user);
  });

  // ─── GET /my-chat ─────────────────────────────────────────────────────────

  describe("GET /api/v1/chat/my-chat", () => {
    it("should return 401 without a token", async () => {
      const res = await request(app)
        .get("/api/v1/chat/my-chat")
        .query({ languageId: language._id.toString() });
      expect(res.statusCode).toBe(401);
    });

    it("should create a new session if none exists and return it", async () => {
      const res = await request(app)
        .get("/api/v1/chat/my-chat")
        .set("Authorization", `Bearer ${token}`)
        .query({ languageId: language._id.toString() });

      expect(res.statusCode).toBe(200);
      const session = res.body.data.session;
      expect(session).toBeDefined();
      expect(session.userId.toString()).toBe(user._id.toString());
    });

    it("should return the existing session on second call", async () => {
      await ChatSession.create({ userId: user._id, languageId: language._id });

      const res = await request(app)
        .get("/api/v1/chat/my-chat")
        .set("Authorization", `Bearer ${token}`)
        .query({ languageId: language._id.toString() });

      expect(res.statusCode).toBe(200);
      // Should not create a second session
      const count = await ChatSession.countDocuments({
        userId: user._id,
        languageId: language._id,
      });
      expect(count).toBe(1);
    });

    it("should return 400 if languageId query param is missing", async () => {
      const res = await request(app)
        .get("/api/v1/chat/my-chat")
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── POST /send ───────────────────────────────────────────────────────────

  describe("POST /api/v1/chat/send", () => {
    it("should send a message and receive an AI reply", async () => {
      const res = await request(app)
        .post("/api/v1/chat/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ languageId: language._id.toString(), message: "Hello!" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.reply).toBe("Mock AI reply");
    });

    it("should store both user and AI messages in the session", async () => {
      await request(app)
        .post("/api/v1/chat/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ languageId: language._id.toString(), message: "Hello!" });

      const session = await ChatSession.findOne({
        userId: user._id,
        languageId: language._id,
      });
      expect(session).not.toBeNull();
      expect(session.messages.length).toBe(2);
      expect(session.messages[0].sender).toBe("user");
      expect(session.messages[1].sender).toBe("ai");
    });

    it("should increment chatCount on the user after each message", async () => {
      await request(app)
        .post("/api/v1/chat/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ languageId: language._id.toString(), message: "One" });

      await request(app)
        .post("/api/v1/chat/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ languageId: language._id.toString(), message: "Two" });

      const updated = await User.findById(user._id);
      expect(updated.chatCount).toBe(2);
    });

    it("should block free users who have reached the 50 message limit", async () => {
      await User.findByIdAndUpdate(user._id, { chatCount: 50 });

      const res = await request(app)
        .post("/api/v1/chat/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ languageId: language._id.toString(), message: "Over limit" });

      expect(res.statusCode).toBe(403);
    });

    it("should allow premium users past the 50 message limit", async () => {
      await User.findByIdAndUpdate(user._id, {
        chatCount: 50,
        isPremium: true,
      });

      const res = await request(app)
        .post("/api/v1/chat/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ languageId: language._id.toString(), message: "Premium OK" });

      expect(res.statusCode).toBe(200);
    });

    it("should reset chatCount when countResetsAt has passed", async () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await User.findByIdAndUpdate(user._id, {
        chatCount: 50,
        countResetsAt: yesterday,
      });

      const res = await request(app)
        .post("/api/v1/chat/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ languageId: language._id.toString(), message: "Reset me" });

      expect(res.statusCode).toBe(200);

      const updated = await User.findById(user._id);
      // Should have been reset and then incremented once
      expect(updated.chatCount).toBe(1);
    });

    it("should return 400 if message body is missing", async () => {
      const res = await request(app)
        .post("/api/v1/chat/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ languageId: language._id.toString() });

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 if languageId body field is missing", async () => {
      const res = await request(app)
        .post("/api/v1/chat/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "Hello!" });

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── PUT /update/:id (AI Memory) ─────────────────────────────────────────

  describe("PUT /api/v1/chat/update/:id", () => {
    let session;

    beforeEach(async () => {
      session = await ChatSession.create({
        userId: user._id,
        languageId: language._id,
      });
    });

    it("should update the aiMemorySummary of a session", async () => {
      const res = await request(app)
        .put(`/api/v1/chat/update/${session._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ aiMemorySummary: "User knows basic greetings." });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.session.aiMemorySummary).toBe(
        "User knows basic greetings."
      );
    });

    it("should return 400 if aiMemorySummary is missing", async () => {
      const res = await request(app)
        .put(`/api/v1/chat/update/${session._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── DELETE /delete/:id ───────────────────────────────────────────────────

  describe("DELETE /api/v1/chat/delete/:id", () => {
    it("should delete a chat session", async () => {
      const session = await ChatSession.create({
        userId: user._id,
        languageId: language._id,
      });

      const res = await request(app)
        .delete(`/api/v1/chat/delete/${session._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      const found = await ChatSession.findById(session._id);
      expect(found).toBeNull();
    });

    it("should return 404 if session does not exist", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .delete(`/api/v1/chat/delete/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });
});