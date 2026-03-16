// middleware/errorHandler.js
exports.errorHandler=(err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Pro tip: Don't leak stack traces to users in production
  const response = {
    status: err.status,
    message: err.message,
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
}
