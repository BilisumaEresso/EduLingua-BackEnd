exports.errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  const response = {
    success: false, // Matches Success Handler
    status: status, // 'fail' or 'error'
    message: err.message || "Internal Server Error",
    data: null, // Consistent structure for frontend parsing
    timestamp: new Date().toISOString(),
  };

  // Add stack trace only in development
  // if (process.env.NODE_ENV === "development") {
  //   response.stack = err.stack;
  // }

  // Handle specific Mongoose errors (Optional but recommended)
  if (err.name === "CastError") {
    response.message = `Invalid ${err.path}: ${err.value}`;
    return res.status(400).json(response);
  }

  console.log(response)
  res.status(statusCode).json(response);
};
