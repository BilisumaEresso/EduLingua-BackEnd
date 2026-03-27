/**
 * Shared test helpers — create seeded data and issue JWT tokens.
 * Used by all integration test files.
 */
const bcrypt = require("bcrypt");
const generateToken = require("../src/utils/generateToken");
const { User, Language, Learning, Level, Lesson, Section } = require("../src/models");

// ─── Language helpers ────────────────────────────────────────────────────────

const createLanguage = async (overrides = {}) => {
  return Language.create({
    name: "English",
    code: "en",
    nativeName: "English",
    ...overrides,
  });
};

// ─── User helpers ────────────────────────────────────────────────────────────

const createUser = async (language, overrides = {}) => {
  const hashedPassword = await bcrypt.hash("password123", 10);
  return User.create({
    email: "user@test.com",
    username: "testuser",
    fullName: "Test User",
    password: hashedPassword,
    nativeLanguage: language._id,
    ...overrides,
  });
};

const createSuperAdmin = async (language, overrides = {}) => {
  return createUser(language, {
    email: "admin@test.com",
    username: "superadmin",
    fullName: "Super Admin",
    role: "super-admin",
    ...overrides,
  });
};

/**
 * Generate a signed JWT for the given user object (plain or Mongoose doc).
 */
const tokenFor = (user) => generateToken(user);

// ─── Learning structure helpers ───────────────────────────────────────────────

const createLearning = async (srcLang, tgtLang, creator, overrides = {}) => {
  return Learning.create({
    title: "Test Learning",
    description: "A test learning path",
    sourceLanguage: srcLang._id,
    targetLanguage: tgtLang._id,
    createdBy: creator._id,
    ...overrides,
  });
};

const createLevel = async (learning, overrides = {}) => {
  return Level.create({
    learning: learning._id,
    levelNumber: 1,
    title: "Beginner",
    difficulty: "beginner",
    order: 1,
    ...overrides,
  });
};

const createLesson = async (level, teacher, overrides = {}) => {
  return Lesson.create({
    level: level._id,
    teacher: teacher._id,
    title: "Test Lesson",
    description: "A test lesson description",
    objective: "Test objective for learning",
    order: 1,
    aiContext: { topic: "greetings", difficulty: "easy" },
    ...overrides,
  });
};

const createSection = async (lesson, overrides = {}) => {
  return Section.create({
    lesson: lesson._id,
    title: "Test Section",
    order: 1,
    objective: "Test section objective",
    ...overrides,
  });
};

module.exports = {
  createLanguage,
  createUser,
  createSuperAdmin,
  tokenFor,
  createLearning,
  createLevel,
  createLesson,
  createSection,
};
