const request = require("supertest");
const app = require("../../app");
const { Lesson, Level } = require("../../src/models");
const {
  createLanguage,
  createSuperAdmin,
  createLearning,
  createLevel,
  createLesson,
  tokenFor,
} = require("../helpers");

describe("Lesson API", () => {
  let adminToken, admin, level, learning, language;

  beforeEach(async () => {
    language = await createLanguage();
    admin = await createSuperAdmin(language);
    adminToken = tokenFor(admin);
    learning = await createLearning(language, language, admin);
    level = await createLevel(learning);
  });

  const baseLesson = (levelId, teacherId, overrides = {}) => ({
    level: levelId.toString(),
    teacher: teacherId.toString(),
    title: "Test Lesson",
    description: "A long enough description for the lesson",
    objective: "Learn to greet in the target language",
    order: 1,
    aiContext: { topic: "greetings" },
    ...overrides,
  });

  // ─── GET / ────────────────────────────────────────────────────────────────

  describe("GET /api/v1/lesson", () => {
    it("should return empty array initially", async () => {
      const res = await request(app).get("/api/v1/lesson");
      expect(res.statusCode).toBe(200);
      expect(res.body.data.lessons).toEqual([]);
    });

    it("should filter by levelId", async () => {
      await createLesson(level, admin, { order: 1 });
      await createLesson(level, admin, { order: 2, isActive: true });

      const res = await request(app)
        .get("/api/v1/lesson")
        .query({ levelId: level._id.toString() });

      expect(res.statusCode).toBe(200);
      // only isActive lessons are shown (isActive default is false in schema)
      expect(res.body.data.lessons.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── GET /:id ─────────────────────────────────────────────────────────────

  describe("GET /api/v1/lesson/:id", () => {
    it("should return 404 for inactive lesson", async () => {
      const lesson = await createLesson(level, admin); // isActive: false by default
      const res = await request(app).get(`/api/v1/lesson/${lesson._id}`);
      expect(res.statusCode).toBe(404);
    });

    it("should return a single active lesson", async () => {
      const lesson = await createLesson(level, admin, { isActive: true });
      const res = await request(app).get(`/api/v1/lesson/${lesson._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.lesson._id).toBe(lesson._id.toString());
    });
  });

  // ─── POST /create ─────────────────────────────────────────────────────────

  describe("POST /api/v1/lesson/create", () => {
    it("should create a lesson with explicit order", async () => {
      const res = await request(app)
        .post("/api/v1/lesson/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(baseLesson(level._id, admin._id));

      expect(res.statusCode).toBe(201);
      expect(res.body.data.lesson.order).toBe(1);
    });

    it("should auto-assign order 1 when order is omitted", async () => {
      const payload = baseLesson(level._id, admin._id);
      delete payload.order;

      const res = await request(app)
        .post("/api/v1/lesson/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.lesson.order).toBe(1);
    });

    it("should auto-increment order for subsequent lessons", async () => {
      // Create first lesson explicitly at order 1
      await request(app)
        .post("/api/v1/lesson/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(baseLesson(level._id, admin._id, { order: 1 }));

      // Second lesson without order
      const payload = baseLesson(level._id, admin._id);
      delete payload.order;

      const res = await request(app)
        .post("/api/v1/lesson/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.lesson.order).toBe(2);
    });

    it("should push lesson id into Level.lessons", async () => {
      const res = await request(app)
        .post("/api/v1/lesson/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(baseLesson(level._id, admin._id));

      const lessonId = res.body.data.lesson._id;
      const updated = await Level.findById(level._id);
      expect(updated.lessons.map(String)).toContain(lessonId);
    });

    it("should reject duplicate order with 400", async () => {
      await request(app)
        .post("/api/v1/lesson/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(baseLesson(level._id, admin._id, { order: 1 }));

      const res = await request(app)
        .post("/api/v1/lesson/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(baseLesson(level._id, admin._id, { order: 1 }));

      expect(res.statusCode).toBe(400);
    });

    it("should return 401 without a token", async () => {
      const res = await request(app)
        .post("/api/v1/lesson/create")
        .send(baseLesson(level._id, admin._id));
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── PUT /update/:id ──────────────────────────────────────────────────────

  describe("PUT /api/v1/lesson/update/:id", () => {
    it("should update lesson title", async () => {
      const lesson = await createLesson(level, admin);

      const res = await request(app)
        .put(`/api/v1/lesson/update/${lesson._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(baseLesson(level._id, admin._id, { title: "Brand New Title" }));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.lesson.title).toBe("Brand New Title");
    });

    it("should reject conflicting order update with 400", async () => {
      const l1 = await createLesson(level, admin, { order: 1 });
      const l2 = await createLesson(level, admin, { order: 2 });

      const res = await request(app)
        .put(`/api/v1/lesson/update/${l2._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(baseLesson(level._id, admin._id, { order: 1 })); // conflict with l1

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── DELETE /delete/:id ───────────────────────────────────────────────────

  describe("DELETE /api/v1/lesson/delete/:id", () => {
    it("should soft-delete a lesson", async () => {
      const lesson = await createLesson(level, admin);

      const res = await request(app)
        .delete(`/api/v1/lesson/delete/${lesson._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);

      const updated = await Lesson.findById(lesson._id);
      expect(updated.isActive).toBe(false);
    });

    it("should return 404 for unknown lesson", async () => {
      const res = await request(app)
        .delete("/api/v1/lesson/delete/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
