const errorHandler = (error, _req, res, _next) => {
  const status = error.statusCode || 500;
  const code = error.code || "UPLOAD_FAILED";
  const message =
    error.message ||
    (status >= 500 ? "Upload failed. Please try again." : "Invalid request");

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};

module.exports = { errorHandler };
