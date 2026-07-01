const errorHandler = (error, _req, res, _next) => {
  const status = error.statusCode || 500;
  const code = error.code || "SERVER_ERROR";
  const message = error.message || "An unexpected error occurred.";

  console.error("💥 Backend Error:", error);

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};

module.exports = { errorHandler };
