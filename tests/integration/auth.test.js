const request = require("supertest");
const app = require("../../app");
const { Language } = require("../../src/models");
const { createLanguage } = require("../helpers");

describe("Auth API", () => {
  let language;

  beforeEach(async () => {
    language = await createLanguage();
  });

  // ─── Signup ───────────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/signup", () => {
    it("should register a new user and return 201 with token", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        email: "test@mail.com",
        username: "testuser",
        fullName: "Test User",
        password: "password123",
        nativeLanguage: language._id.toString(),
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.email).toBe("test@mail.com");
      expect(res.body.data.user.username).toBe("testuser");
      expect(res.body.data.token).toBeDefined();
      // password must never leak
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("should reject duplicate email with 400", async () => {
      const payload = {
        email: "dup@mail.com",
        username: "firstuser",
        fullName: "First User",
        password: "password123",
        nativeLanguage: language._id.toString(),
      };
      await request(app).post("/api/v1/auth/signup").send(payload);

      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ ...payload, username: "seconduser" });

      expect(res.statusCode).toBe(400);
    });

    it("should reject duplicate username with 400", async () => {
      const payload = {
        email: "first@mail.com",
        username: "sameuser",
        fullName: "First User",
        password: "password123",
        nativeLanguage: language._id.toString(),
      };
      await request(app).post("/api/v1/auth/signup").send(payload);

      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ ...payload, email: "second@mail.com" });

      expect(res.statusCode).toBe(400);
    });

    it("should reject missing required fields with 400", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        email: "incomplete@mail.com",
        // missing username, fullName, password, nativeLanguage
      });
      expect(res.statusCode).toBe(400);
    });

    it("should reject a short password with 400", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        email: "short@mail.com",
        username: "shortpwd",
        fullName: "Short Pwd",
        password: "123", // too short (< 6)
        nativeLanguage: language._id.toString(),
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── Login ────────────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/auth/signup").send({
        email: "login@mail.com",
        username: "loginuser",
        fullName: "Login User",
        password: "password123",
        nativeLanguage: language._id.toString(),
      });
    });

    it("should login with email and return token", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@mail.com",
        password: "password123",
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it("should login with username and return token", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        username: "loginuser",
        password: "password123",
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it("should reject wrong password with 400", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@mail.com",
        password: "wrongpassword",
      });
      expect(res.statusCode).toBe(400);
    });

    it("should reject non-existent user with 400", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "ghost@mail.com",
        password: "password123",
      });
      expect(res.statusCode).toBe(400);
    });

    it("should reject login with both email and username (xor)", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@mail.com",
        username: "loginuser",
        password: "password123",
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── Protected: GET /me ───────────────────────────────────────────────────

  describe("GET /api/v1/auth/me", () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        email: "me@mail.com",
        username: "meuser",
        fullName: "Me User",
        password: "password123",
        nativeLanguage: language._id.toString(),
      });
      token = res.body.data.token;
    });

    it("should return the current user", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe("me@mail.com");
    });

    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Update User ──────────────────────────────────────────────────────────

  describe("PUT /api/v1/auth/update", () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        email: "update@mail.com",
        username: "updateuser",
        fullName: "Update User",
        password: "password123",
        nativeLanguage: language._id.toString(),
      });
      token = res.body.data.token;
    });

    it("should update fullName successfully", async () => {
      const res = await request(app)
        .put("/api/v1/auth/update")
        .set("Authorization", `Bearer ${token}`)
        .send({ fullName: "Updated Name" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.fullName).toBe("Updated Name");
    });

    it("should reject update with no fields (empty body)", async () => {
      const res = await request(app)
        .put("/api/v1/auth/update")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── Change Password ──────────────────────────────────────────────────────

  describe("PUT /api/v1/auth/change-password", () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        email: "pwd@mail.com",
        username: "pwduser",
        fullName: "Pwd User",
        password: "password123",
        nativeLanguage: language._id.toString(),
      });
      token = res.body.data.token;
    });

    it("should change password with correct current password", async () => {
      const res = await request(app)
        .put("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ password: "password123", newPassword: "newpassword456" });

      expect(res.statusCode).toBe(200);
    });

    it("should reject wrong current password with 400", async () => {
      const res = await request(app)
        .put("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ password: "WRONGONE", newPassword: "newpassword456" });

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── Delete User ──────────────────────────────────────────────────────────

  describe("DELETE /api/v1/auth/delete", () => {
    it("should delete the authenticated user", async () => {
      const signupRes = await request(app).post("/api/v1/auth/signup").send({
        email: "del@mail.com",
        username: "deluser",
        fullName: "Del User",
        password: "password123",
        nativeLanguage: language._id.toString(),
      });
      const token = signupRes.body.data.token;

      const res = await request(app)
        .delete("/api/v1/auth/delete")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);

      // Attempting to login again should fail
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "del@mail.com",
        password: "password123",
      });
      expect(loginRes.statusCode).toBe(400);
    });
  });
});