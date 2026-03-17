const sendSuccess = (
  res,
  statusCode = 200,
  message = "Success",
  data = null,
) => {
  return res.status(statusCode).json({
    success: true,
    status: "success",
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

module.exports = sendSuccess;
