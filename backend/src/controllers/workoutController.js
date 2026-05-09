const { UserProfile, mapUserProfileToResponse } = require("../models/UserProfile");
const { generateWorkoutPlanWithGemini } = require("../services/geminiWorkoutService");
const { createAppError } = require("../middleware/errorHandler");

const profileFilter = { profile_key: "primary" };

const generateWorkoutPlan = async (req, res, next) => {
  try {
    const profile = await UserProfile.findOne(profileFilter).lean();
    if (!profile) {
      return next(createAppError(404, "NOT_FOUND", "Profile not found."));
    }

    const mappedProfile = mapUserProfileToResponse(profile);
    const workoutPlan = await generateWorkoutPlanWithGemini(mappedProfile);

    // Save the plan to the user profile
    const updatedProfile = await UserProfile.findOneAndUpdate(
      profileFilter,
      { workout_plan: workoutPlan },
      { new: true, upsert: true }
    ).lean();

    res.status(200).json({ success: true, data: workoutPlan });
  } catch (error) {
    console.error("Workout Controller Error:", error);
    next(createAppError(500, "GENERATION_FAILED", "Failed to generate workout plan."));
  }
};

const getWorkoutPlan = async (req, res, next) => {
  try {
    const profile = await UserProfile.findOne(profileFilter).lean();
    if (!profile || !profile.workout_plan) {
      return res.status(200).json({ success: true, data: null });
    }
    res.status(200).json({ success: true, data: profile.workout_plan });
  } catch (error) {
    next(createAppError(500, "FETCH_FAILED", "Failed to fetch workout plan."));
  }
};

module.exports = { generateWorkoutPlan, getWorkoutPlan };
