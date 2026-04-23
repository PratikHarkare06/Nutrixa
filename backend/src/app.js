const express = require("express");
const cors = require("cors");
const path = require("path");
const { env } = require("./config/env");
const uploadRoutes = require("./routes/uploadRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const uploadsDirectory = path.join(__dirname, "..", "uploads");

app.use(
  cors({
    origin: env.corsOrigin,
  }),
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDirectory));

app.use("/api", uploadRoutes);
app.use(errorHandler);

module.exports = app;
