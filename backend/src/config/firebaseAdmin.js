// firebaseAdmin.js — Initialize Firebase Admin SDK safely for server-side token verification
const admin = require("firebase-admin");

try {
  if (!admin.apps || admin.apps.length === 0) {
    const config = {};
    if (process.env.FIREBASE_PROJECT_ID) {
      config.projectId = process.env.FIREBASE_PROJECT_ID;
    } else {
      console.warn("⚠️ FIREBASE_PROJECT_ID environment variable is missing!");
    }
    admin.initializeApp(config);
    console.log("🔒 Firebase Admin SDK initialized successfully.");
  }
} catch (error) {
  console.error("❌ Firebase Admin SDK initialization failed:", error.message);
}

module.exports = admin;
