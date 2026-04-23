const {
  UserProfile,
  activityLevelOptions,
  allergyOptions,
  defaultUserProfile,
  dietaryRestrictionOptions,
  genderOptions,
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

module.exports = { getProfile, saveProfile };
