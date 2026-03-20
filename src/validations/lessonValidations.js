// validations/lessonValidations.js
const Joi = require("joi");

// Lesson
const addLessonSchema = Joi.object({
  language: Joi.string().required(),
  preferedLanguage: Joi.string().required(),
  level: Joi.number().integer().min(1).max(5),
  title: Joi.string().min(3).max(40).required(),
  desc: Joi.string().min(3).max(150).required(),
});

const updateLessonSchema = Joi.object({
  language: Joi.string(),
  preferedLanguage: Joi.string(),
  level: Joi.number().integer().min(1).max(5),
  title: Joi.string().min(3).max(40),
  desc: Joi.string().min(3).max(150),
  isActive: Joi.boolean(),
}).min(1);

// Section
const addSectionSchema = Joi.object({
  lessonId: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string(),
  order: Joi.number().integer(),
});

const updateSectionSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  order: Joi.number().integer(),
}).min(1);

// Resource
const addResourceSchema = Joi.object({
  type: Joi.string().valid("video", "text", "file", "audio").required(),
  url: Joi.string().uri(),
  content: Joi.string(),
  title: Joi.string().required(),
  order: Joi.number().integer(),
}).or("url", "content");

const updateResourceSchema = Joi.object({
  type: Joi.string().valid("video", "text", "file", "audio"),
  url: Joi.string().uri(),
  content: Joi.string(),
  title: Joi.string(),
  order: Joi.number().integer(),
}).min(1);

// Quiz
const addQuizSchema = Joi.object({
  lessonId: Joi.string().required(),
  title: Joi.string().required(),
  passingScore: Joi.number().min(0).max(100).default(60),
  questions: Joi.array()
    .items(
      Joi.object({
        text: Joi.string().required(),
        options: Joi.array().items(Joi.string()).min(2).required(),
        correctAnswer: Joi.string().required(),
      }),
    )
    .required(),
});

const updateQuizSchema = Joi.object({
  title: Joi.string(),
  passingScore: Joi.number().min(0).max(100),
  questions: Joi.array().items(
    Joi.object({
      text: Joi.string(),
      options: Joi.array().items(Joi.string()).min(2),
      correctAnswer: Joi.string(),
    }),
  ),
}).min(1);

// Student actions
const takeQuizSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().required(),
        answer: Joi.string().required(),
      }),
    )
    .required(),
});

const updateProgressSchema = Joi.object({
  lessonId: Joi.string().required(),
  sectionId: Joi.string().required(),
  completed: Joi.boolean().required(),
});

const changeLanguageSchema = Joi.object({
  languageCode: Joi.string().required(),
});

// Pagination (for queries) – can be reused
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});
