const express = require("express");
const cors = require("cors");
const path = require("path");
const { env } = require("./config/env");
const uploadRoutes = require("./routes/uploadRoutes");
const historyRoutes = require("./routes/historyRoutes");
const profileRoutes = require("./routes/profileRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const uploadsDirectory = path.join(__dirname, "..", "uploads");

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDirectory));

app.use("/api", uploadRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/workout", workoutRoutes);
app.use(errorHandler);

module.exports = app;
