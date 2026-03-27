const request = require("supertest");
const app = require("../../app");
const { Section, Lesson } = require("../../src/models");
const {
  createLanguage,
  createSuperAdmin,
  createLearning,
  createLevel,
  createLesson,
  createSection,
  tokenFor,
} = require("../helpers");

describe("Section API", () => {
  let adminToken, level, lesson, language;

  beforeEach(async () => {
    language = await createLanguage();
    const admin = await createSuperAdmin(language);
    adminToken = tokenFor(admin);

    const learning = await createLearning(language, language, admin);
    level = await createLevel(learning);
    lesson = await createLesson(level, admin);
  });

  // ─── GET / ────────────────────────────────────────────────────────────────

  describe("GET /api/v1/section", () => {
    it("should return all sections (empty initially)", async () => {
      const res = await request(app).get("/api/v1/section");
      expect(res.statusCode).toBe(200);
      expect(res.body.data.sections).toEqual([]);
    });

    it("should filter sections by lessonId", async () => {
      await createSection(lesson, { order: 1 });
      await createSection(lesson, { order: 2 });

      const res = await request(app)
        .get("/api/v1/section")
        .query({ lessonId: lesson._id.toString() });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.sections.length).toBe(2);
    });
  });

  // ─── GET /:id ─────────────────────────────────────────────────────────────

  describe("GET /api/v1/section/:id", () => {
    it("should return a single section by id", async () => {
      const section = await createSection(lesson);

      const res = await request(app).get(
        `/api/v1/section/${section._id.toString()}`
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.data.section._id).toBe(section._id.toString());
    });

    it("should return 404 for unknown id", async () => {
      const res = await request(app).get(
        "/api/v1/section/507f1f77bcf86cd799439011"
      );
      expect(res.statusCode).toBe(404);
    });
  });

  // ─── POST /create ─────────────────────────────────────────────────────────

  describe("POST /api/v1/section/create", () => {
    const baseSection = () => ({
      title: "My Section",
      objective: "Learn something useful",
      contentBlocks: [],
    });

    it("should create a section with auto-assigned order 1", async () => {
      const res = await request(app)
        .post("/api/v1/section/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...baseSection(),
          lesson: lesson._id.toString(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.section.order).toBe(1);
    });

    it("should assign sequential order when sections already exist", async () => {
      // Create two sections first
      await request(app)
        .post("/api/v1/section/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...baseSection(), lesson: lesson._id.toString() });

      await request(app)
        .post("/api/v1/section/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...baseSection(), lesson: lesson._id.toString() });

      const res = await request(app)
        .post("/api/v1/section/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...baseSection(), lesson: lesson._id.toString() });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.section.order).toBe(3);
    });

    it("should link the new section into Lesson.sections", async () => {
      const res = await request(app)
        .post("/api/v1/section/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...baseSection(), lesson: lesson._id.toString() });

      const sectionId = res.body.data.section._id;
      const updated = await Lesson.findById(lesson._id);
      expect(updated.sections.map(String)).toContain(sectionId);
    });

    it("should reject a conflicting explicit order with 400", async () => {
      await createSection(lesson, { order: 5 });

      const res = await request(app)
        .post("/api/v1/section/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...baseSection(), lesson: lesson._id.toString(), order: 5 });

      expect(res.statusCode).toBe(400);
    });

    it("should return 401 without a token", async () => {
      const res = await request(app)
        .post("/api/v1/section/create")
        .send({ ...baseSection(), lesson: lesson._id.toString() });

      expect(res.statusCode).toBe(401);
    });

    it("should return 400 if lesson does not exist", async () => {
      const res = await request(app)
        .post("/api/v1/section/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...baseSection(), lesson: "507f1f77bcf86cd799439011" });

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── POST /bulk ───────────────────────────────────────────────────────────

  describe("POST /api/v1/section/bulk", () => {
    it("should create multiple sections sequentially from order 1", async () => {
      const res = await request(app)
        .post("/api/v1/section/bulk")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          lessonId: lesson._id.toString(),
          sections: [
            { title: "A", objective: "Objective A", contentBlocks: [] },
            { title: "B", objective: "Objective B", contentBlocks: [] },
            { title: "C", objective: "Objective C", contentBlocks: [] },
          ],
        });

      expect(res.statusCode).toBe(201);
      const orders = res.body.data.sections.map((s) => s.order);
      expect(orders).toEqual([1, 2, 3]);
    });

    it("should append sections after existing ones without gaps", async () => {
      // Create 2 existing sections
      await createSection(lesson, { order: 1 });
      await createSection(lesson, { order: 2 });

      const res = await request(app)
        .post("/api/v1/section/bulk")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          lessonId: lesson._id.toString(),
          sections: [
            { title: "D", objective: "Objective D", contentBlocks: [] },
            { title: "E", objective: "Objective E", contentBlocks: [] },
          ],
        });

      expect(res.statusCode).toBe(201);
      const orders = res.body.data.sections.map((s) => s.order);
      expect(orders).toEqual([3, 4]);
    });

    it("should update Lesson.sections with the new ids", async () => {
      const res = await request(app)
        .post("/api/v1/section/bulk")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          lessonId: lesson._id.toString(),
          sections: [
            { title: "X", objective: "Obj X", contentBlocks: [] },
          ],
        });

      const newId = res.body.data.sections[0]._id;
      const updated = await Lesson.findById(lesson._id);
      expect(updated.sections.map(String)).toContain(newId);
    });
  });

  // ─── PUT /update/:id ──────────────────────────────────────────────────────

  describe("PUT /api/v1/section/update/:id", () => {
    it("should update section title", async () => {
      const section = await createSection(lesson);

      const res = await request(app)
        .put(`/api/v1/section/update/${section._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          lesson: lesson._id.toString(),
          title: "Updated Title",
          objective: section.objective,
          order: section.order,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.section.title).toBe("Updated Title");
    });

    it("should reject a conflicting order update with 400", async () => {
      const s1 = await createSection(lesson, { order: 1 });
      const s2 = await createSection(lesson, { order: 2 });

      const res = await request(app)
        .put(`/api/v1/section/update/${s2._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          lesson: lesson._id.toString(),
          title: s2.title,
          objective: s2.objective,
          order: 1, // conflicts with s1
        });

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── DELETE /delete/:id ───────────────────────────────────────────────────

  describe("DELETE /api/v1/section/delete/:id", () => {
    it("should soft-delete a section", async () => {
      const section = await createSection(lesson);

      const res = await request(app)
        .delete(`/api/v1/section/delete/${section._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);

      const updated = await Section.findById(section._id);
      expect(updated.isActive).toBe(false);
    });

    it("should return 404 for unknown section", async () => {
      const res = await request(app)
        .delete("/api/v1/section/delete/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
