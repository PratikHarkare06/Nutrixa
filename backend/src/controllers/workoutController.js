const { UserProfile, mapUserProfileToResponse } = require("../models/UserProfile");
const { WorkoutLog } = require("../models/WorkoutLog");
const { generateWorkoutPlanWithGemini } = require("../services/geminiWorkoutService");
const { createAppError } = require("../utils/createAppError");

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

const completeWorkoutSession = async (req, res, next) => {
  try {
    const { workout_name, duration_mins, calories_burned, date } = req.body;

    if (!workout_name || !duration_mins || !calories_burned) {
      return next(createAppError(400, "INVALID_DATA", "Missing workout parameters."));
    }

    const logDate = date || new Date().toISOString().split("T")[0];

    // 1. Create Workout Log
    const newLog = await WorkoutLog.create({
      date: logDate,
      workout_name,
      duration_mins: Number(duration_mins),
      calories_burned: Number(calories_burned),
    });

    // 2. Fetch profile to award XP
    const profile = await UserProfile.findOne(profileFilter);
    if (!profile) {
      return next(createAppError(404, "NOT_FOUND", "Profile not found."));
    }

    const oldXp = profile.xp || 0;
    const newXp = oldXp + 100;
    const oldLevel = profile.level || 1;
    const newLevel = Math.floor(newXp / 500) + 1;
    const levelUp = newLevel > oldLevel;

    // Badge Unlocks
    const badges = profile.unlocked_badges || [];
    let badgeUnlocked = null;

    if (!badges.includes("Workout Warrior")) {
      badges.push("Workout Warrior");
      badgeUnlocked = "Workout Warrior";
    }

    if (newLevel >= 2 && !badges.includes("Fitness Master")) {
      badges.push("Fitness Master");
      badgeUnlocked = "Fitness Master";
    }

    // Save profile changes
    profile.xp = newXp;
    profile.level = newLevel;
    profile.unlocked_badges = badges;
    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        log: newLog,
        xp: newXp,
        level: newLevel,
        levelUp,
        badgeUnlocked,
        unlockedBadges: badges,
      },
    });
  } catch (error) {
    console.error("Complete Workout Controller Error:", error);
    next(createAppError(500, "SAVE_FAILED", "Failed to log workout session."));
  }
};

module.exports = { generateWorkoutPlan, getWorkoutPlan, completeWorkoutSession };
