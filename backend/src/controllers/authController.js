// authController.js — Firebase-first auth controller
const { User } = require("../models/User");
const { createAppError } = require("../utils/createAppError");

// POST /api/auth/sync
// Called by the frontend after every Firebase sign-in/register to upsert the user in MongoDB
const syncFirebaseUser = async (req, res, next) => {
  try {
    const { uid, name, email } = req.body;

    if (!uid || !email) {
      return next(createAppError(400, "INVALID_DATA", "Firebase UID and email are required."));
    }

    // Upsert: find by Firebase UID, create if doesn't exist
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Also check if there's a legacy local account with this email
      const legacyUser = await User.findOne({ email: email.toLowerCase() });
      if (legacyUser) {
        // Link the Firebase UID to the legacy account
        legacyUser.firebaseUid = uid;
        legacyUser.provider = "firebase";
        await legacyUser.save();
        user = legacyUser;
      } else {
        // Create new Firebase user
        user = await User.create({
          firebaseUid: uid,
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          provider: "firebase",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.firebaseUid || user._id,
        name: user.name,
        email: user.email,
        hasCompletedProfile: user.has_completed_profile,
      },
    });
  } catch (error) {
    console.error("Sync Error:", error);
    next(createAppError(500, "SYNC_FAILED", `Failed to sync user account: ${error.message}`));
  }
};

// GET /api/auth/me
// Returns current user info (requires valid Firebase token via protect middleware)
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user.firebaseUid || req.user._id,
        name: req.user.name,
        email: req.user.email,
        hasCompletedProfile: req.user.has_completed_profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncFirebaseUser,
  getMe,
};
