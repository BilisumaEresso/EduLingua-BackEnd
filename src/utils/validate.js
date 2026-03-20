// utils/validate.js
const Joi = require("joi");
const AppError = require("./AppError");

const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    if (error) {
        throw new AppError(error.message[0],400)
    }
    next();
  };
};

module.exports = validate;
