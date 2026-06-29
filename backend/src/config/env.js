require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";
const requiredEnv = ["MONGO_URI", "FIREBASE_PROJECT_ID", "GEMINI_API_KEY", "NIM_API_KEY"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  if (isProduction) {
    console.error(`❌ CRITICAL CONFIG ERROR: Missing required environment variables: ${missingEnv.join(", ")}`);
    process.exit(1);
  } else {
    console.warn(`⚠️ CONFIG WARNING: Missing environment variables: ${missingEnv.join(", ")}. Dev fallbacks will be used.`);
  }
}

const env = {
  appUrl: process.env.APP_URL || "http://localhost:5000",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/nutrivision",
  port: Number(process.env.PORT || 5000),
};

module.exports = { env };
