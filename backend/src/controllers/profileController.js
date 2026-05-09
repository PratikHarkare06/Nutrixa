const {
  UserProfile,
  activityLevelOptions,
  allergyOptions,
  defaultUserProfile,
  dietaryRestrictionOptions,
  genderOptions,
  dietModeOptions,
  mapUserProfileToResponse,
} = require("../models/UserProfile");
const { createAppError } = require("../utils/createAppError");

const profileFilter = { profile_key: "primary" };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isPositiveNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const normalizeArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const validateProfilePayload = (payload) => {
  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const age = Number(payload.age);
  const gender = typeof payload.gender === "string" ? payload.gender.trim() : "";
  const activityLevel =
    typeof payload.activityLevel === "string" ? payload.activityLevel.trim() : "";
  const height = Number(payload.height);
  const weight = Number(payload.weight);
  const dietMode = typeof payload.dietMode === "string" ? payload.dietMode.trim() : "Balanced";
  const dietaryRestrictions = normalizeArray(payload.dietaryRestrictions);
  const foodAllergies = normalizeArray(payload.foodAllergies);

  if (
    !fullName ||
    !email ||
    payload.age === undefined ||
    payload.age === null ||
    payload.age === "" ||
    !gender ||
    !activityLevel ||
    payload.height === undefined ||
    payload.height === null ||
    payload.height === "" ||
    payload.weight === undefined ||
    payload.weight === null ||
    payload.weight === ""
  ) {
    throw createAppError(400, "VALIDATION_FAILED", "Please fill all required fields.");
  }

  const hasInvalidValue =
    !emailPattern.test(email) ||
    !isPositiveNumber(age) ||
    !isPositiveNumber(height) ||
    !isPositiveNumber(weight) ||
    !genderOptions.includes(gender) ||
    !activityLevelOptions.includes(activityLevel) ||
    !dietModeOptions.includes(dietMode) ||
    dietaryRestrictions.some((item) => !dietaryRestrictionOptions.includes(item)) ||
    foodAllergies.some((item) => !allergyOptions.includes(item));

  if (hasInvalidValue) {
    throw createAppError(400, "VALIDATION_FAILED", "Invalid value entered.");
  }

  return {
    activity_level: activityLevel,
    age,
    dietary_restrictions: dietaryRestrictions,
    email,
    food_allergies: foodAllergies,
    gender,
    height_cm: height,
    diet_mode: dietMode,
    name: fullName,
    profile_key: "primary",
    weight_kg: weight,
  };
};

const getProfile = async (_req, res, next) => {
  try {
    const profile = await UserProfile.findOne(profileFilter).lean();

    res.status(200).json({
      success: true,
      data: profile ? mapUserProfileToResponse(profile) : defaultUserProfile,
    });
  } catch (_error) {
    next(createAppError(500, "FETCH_FAILED", "Failed to load profile. Retry."));
  }
};

const saveProfile = async (req, res, next) => {
  try {
    const update = validateProfilePayload(req.body);
    const profile = await UserProfile.findOneAndUpdate(profileFilter, update, {
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true,
    });

    res.status(200).json({
      success: true,
      data: mapUserProfileToResponse(profile),
    });
  } catch (error) {
    if (error.statusCode) {
      next(error);
      return;
    }

    next(createAppError(500, "SAVE_FAILED", "Failed to save profile. Retry."));
  }
};

const { getMealSuggestions, generatePersonalizedDietPlan } = require("../services/geminiAnalysisService");

const suggestMeals = async (req, res, next) => {
  try {
    const { remainingCalories, remainingProtein } = req.body;
    if (remainingCalories === undefined) {
      return next(createAppError(400, "INVALID_DATA", "Missing remainingCalories"));
    }
    const suggestions = await getMealSuggestions(remainingCalories, remainingProtein || 20);
    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
};

const generateDietPlan = async (req, res, next) => {
  try {
    const profile = await UserProfile.findOne(profileFilter).lean();
    if (!profile) {
      return next(createAppError(404, "NOT_FOUND", "Profile not found"));
    }

    // Need to calculate metrics first
    const { calculateBMIAndCalories } = require("../models/UserProfile");
    // Since calculateBMIAndCalories is not exported directly, wait, I can just recalculate here
    // or I can call mapUserProfileToResponse which returns metrics.
    const mapped = mapUserProfileToResponse(profile);
    
    // mapped contains maintenanceCalories, etc.
    const dietPlan = await generatePersonalizedDietPlan(profile, mapped);
    
    // Save to DB
    await UserProfile.findOneAndUpdate(profileFilter, { diet_plan: dietPlan });
    
    res.status(200).json({ success: true, data: dietPlan });
  } catch (error) {
    console.error(error);
    next(createAppError(500, "GENERATE_FAILED", "Failed to generate diet plan. Retry."));
  }
};

const { ProgressLog } = require("../models/ProgressLog");
const { env } = require("../config/env");

const getProgressLogs = async (req, res, next) => {
  try {
    const logs = await ProgressLog.find({}).sort({ created_at: -1 }).lean();
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(createAppError(500, "FETCH_FAILED", "Failed to fetch progress logs."));
  }
};

const addProgressLog = async (req, res, next) => {
  try {
    const { weight_kg, date, notes } = req.body;
    
    if (!weight_kg || !date) {
      return next(createAppError(400, "INVALID_DATA", "Weight and date are required."));
    }

    const weightNum = parseFloat(weight_kg);
    let imageUrl = null;
    
    if (req.file) {
      imageUrl = `${env.appUrl}/uploads/${req.file.filename}`;
    }

    const newLog = await ProgressLog.create({
      date,
      weight_kg: weightNum,
      image_url: imageUrl,
      notes: notes || "",
    });

    // Automatically update the user's master profile weight
    await UserProfile.findOneAndUpdate(
      profileFilter,
      { weight_kg: weightNum },
      { upsert: true }
    );

    res.status(200).json({ success: true, data: newLog });
  } catch (error) {
    next(createAppError(500, "SAVE_FAILED", "Failed to add progress log."));
  }
};

module.exports = { getProfile, saveProfile, suggestMeals, generateDietPlan, getProgressLogs, addProgressLog };
