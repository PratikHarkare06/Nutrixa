require("dotenv").config();

const env = {
  appUrl: process.env.APP_URL || "http://localhost:5000",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/nutrivision",
  port: Number(process.env.PORT || 5000),
};

module.exports = { env };
