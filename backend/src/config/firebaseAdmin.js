// firebaseAdmin.js — Initialize Firebase Admin SDK for server-side token verification
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const config = {};
  if (process.env.FIREBASE_PROJECT_ID) {
    config.projectId = process.env.FIREBASE_PROJECT_ID;
  }
  admin.initializeApp(config);
}

module.exports = admin;
