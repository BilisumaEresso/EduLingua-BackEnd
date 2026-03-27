const Joi = require("joi");

// SIGNUP validation
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  fullName: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).required(),
  nativeLanguage: Joi.string().required(), // ObjectId string of Language
  accountType: Joi.string().optional(), // ObjectId string of Language
});

// LOGIN validation
const loginSchema = Joi.object({
  email: Joi.string().email(),
  username: Joi.string().alphanum().min(3).max(30),
  password: Joi.string().required(),
}).xor("email", "username"); // Require exactly one of email or username

// UPDATE USER validation
const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  username: Joi.string().alphanum().min(3).max(30),
  fullName: Joi.string().min(3).max(50),
  nativeLanguage: Joi.string(), // ObjectId string
}).min(1); // Require at least one field

// CHANGE PASSWORD validation
const changePasswordSchema = Joi.object({
  password: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

// PREMIUM upgrade validation
const premiumSchema = Joi.object({}); // no body required

// TEACHER application validation
const teacherApplySchema = Joi.object({}); // no body for now

// UNSUBSCRIBE PREMIUM validation
const unsubscribeSchema = Joi.object({}); // no body required

module.exports = {
  signupSchema,
  loginSchema,
  updateUserSchema,
  changePasswordSchema,
  premiumSchema,
  teacherApplySchema,
  unsubscribeSchema,
};
