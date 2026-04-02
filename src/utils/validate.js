// utils/validate.js
const Joi = require("joi");
const AppError = require("./AppError");

const validate = (schema, property = "body") => {
  return (req, res, next) => {
    // abortEarly: false – collect all validation errors, not just the first
    // stripUnknown: true – ignore any fields not defined in the schema
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      // Map Joi error details into an array of objects
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."), // e.g., "user.email"
        message: detail.message, // e.g., "email is required"
      }));
      // Throw AppError with the details array as the third argument (data)
      throw new AppError("Validation failed", 400, errors);
    }
    
    // Replace the request property with the validated and stripped value
    req[property] = value;
    next();
  };
};

module.exports = validate;
