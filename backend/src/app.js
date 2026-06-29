const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { env } = require("./config/env");
const uploadRoutes = require("./routes/uploadRoutes");
const historyRoutes = require("./routes/historyRoutes");
const profileRoutes = require("./routes/profileRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const sleepRoutes = require("./routes/sleepRoutes");
const authRoutes = require("./routes/authRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const uploadsDirectory = path.join(__dirname, "..", "uploads");

// Mount HTTP security headers
app.use(helmet());

// Configure API rate limiting (150 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests from this IP, please try again after 15 minutes."
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all api routes
app.use("/api", apiLimiter);

// Strip trailing slash from CORS_ORIGIN (common misconfiguration)
const corsOrigin = (process.env.CORS_ORIGIN || "http://localhost:5173").replace(/\/$/, "");

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);

app.use(express.json());
app.use("/uploads", express.static(uploadsDirectory));

app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/sleep", sleepRoutes);
app.use(errorHandler);

module.exports = app;
