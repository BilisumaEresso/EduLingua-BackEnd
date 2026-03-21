// validations/authValidations.js
const Joi = require("joi");

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  fullName: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).required(),
  nativeLanguage: Joi.string().required(), // adjust if language is ObjectId
});

const loginSchema = Joi.object({
  email: Joi.string().email(),
  username: Joi.string().alphanum().min(3).max(30),
  password: Joi.string().required(),
}).xor("email", "username"); // exactly one of email or username

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  username: Joi.string().alphanum().min(3).max(30),
  fullName: Joi.string().min(3).max(50),
  nativeLanguage: Joi.string(),
}).min(1); // at least one field to update

const changePasswordSchema = Joi.object({
  password: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

// validations/authValidations.js (add these schemas)
const premiumSchema = Joi.object({
  // possibly no body, just the action
});

const teacherApplySchema = Joi.object({
  // maybe additional info like bio, etc.
  // for now, empty body
});

const unsubscribeSchema = Joi.object({
  // empty body
});

module.exports = {
  signupSchema,
  loginSchema,
  updateUserSchema,
  changePasswordSchema,
  premiumSchema,
  teacherApplySchema,
  unsubscribeSchema
};