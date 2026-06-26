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
    let profile = await UserProfile.findOne(profileFilter).lean();
    if (!profile) {
      const defaultData = {
        activity_level: "Moderately Active",
        age: 30,
        dietary_restrictions: ["Vegetarian", "Gluten-Free"],
        email: "sarah.johnson@email.com",
        food_allergies: ["Shellfish"],
        gender: "Female",
        height_cm: 165,
        diet_mode: "Balanced",
        name: "Sarah Johnson",
        profile_key: "primary",
        weight_kg: 62,
      };
      const created = await UserProfile.create(defaultData);
      profile = created.toObject ? created.toObject() : created;
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
const { getImageUrl } = require("../utils/urlHelper");

const getProgressLogs = async (req, res, next) => {
  try {
    const logs = await ProgressLog.find({}).sort({ created_at: -1 }).lean();
    const mappedLogs = logs.map((log) => {
      let imageUrl = log.image_url;
      if (imageUrl) {
        const uploadsIndex = imageUrl.indexOf("/uploads/");
        if (uploadsIndex !== -1) {
          const filename = imageUrl.slice(uploadsIndex + 9);
          const protocol = req.headers["x-forwarded-proto"] || req.protocol;
          const host = req.get("host");
          imageUrl = `${protocol}://${host}/uploads/${filename}`;
        }
      }
      return {
        ...log,
        image_url: imageUrl,
      };
    });
    res.status(200).json({ success: true, data: mappedLogs });
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
      imageUrl = getImageUrl(req, req.file.filename);
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

const generateGroceryListHandler = async (req, res, next) => {
  try {
    const profile = await UserProfile.findOne(profileFilter).lean();
    
    // If no custom diet plan exists, fall back to the default diet plan structure to generate the grocery list
    const dietPlanToUse = (profile && profile.diet_plan && profile.diet_plan.length > 0)
      ? profile.diet_plan
      : [
          {
            day: "Monday",
            meals: [
              { type: "Breakfast", name: "Oatmeal with berries", description: "Steel cut oats with fruit", calories: 400, protein: 15, carbs: 65, fat: 8 }
            ]
          },
          {
            day: "Tuesday",
            meals: [
              { type: "Breakfast", name: "Avocado Toast with Poached Egg", description: "Whole grain sourdough, smashed avocado, and two organic eggs.", calories: 420, protein: 18, carbs: 32, fat: 12 },
              { type: "Lunch", name: "Mediterranean Quinoa Bowl", description: "Fresh cucumbers, feta cheese, chickpeas, and lemon-herb dressing.", calories: 580, protein: 14, carbs: 45, fat: 16 },
              { type: "Dinner", name: "Grilled Salmon & Asparagus", description: "Wild-caught salmon with roasted garlic asparagus and brown rice.", calories: 650, protein: 38, carbs: 20, fat: 22 }
            ]
          }
        ];

    const { generateGroceryList } = require("../services/geminiAnalysisService");
    const groceryList = await generateGroceryList(dietPlanToUse);

    res.status(200).json({ success: true, data: groceryList });
  } catch (error) {
    console.error(error);
    next(createAppError(500, "GENERATE_FAILED", "Failed to generate grocery list."));
  }
};

const getPantryRecipes = async (req, res, next) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return next(createAppError(400, "INVALID_DATA", "Ingredients array is required."));
    }

    const profile = await UserProfile.findOne(profileFilter).lean();
    const { generateRecipesFromIngredients } = require("../services/geminiAnalysisService");
    const recipes = await generateRecipesFromIngredients(ingredients, profile || {});

    res.status(200).json({ success: true, data: recipes });
  } catch (error) {
    console.error("getPantryRecipes Controller Error:", error);
    next(createAppError(500, "GENERATE_FAILED", "Failed to generate recipe ideas."));
  }
};

const getAllergenSubstitutes = async (req, res, next) => {
  try {
    const { ingredients, allergies, restrictions } = req.body;
    if (!ingredients || !Array.isArray(ingredients)) {
      return next(createAppError(400, "INVALID_DATA", "Ingredients array is required."));
    }

    const { generateSubstitutesForAllergens } = require("../services/geminiAnalysisService");
    const substitutes = await generateSubstitutesForAllergens(ingredients, allergies || [], restrictions || []);

    res.status(200).json({ success: true, data: substitutes });
  } catch (error) {
    console.error("getAllergenSubstitutes Controller Error:", error);
    next(createAppError(500, "GENERATE_FAILED", "Failed to generate allergen substitutes."));
  }
};

module.exports = { 
  getProfile, 
  saveProfile, 
  suggestMeals, 
  generateDietPlan, 
  getProgressLogs, 
  addProgressLog, 
  generateGroceryList: generateGroceryListHandler,
  getPantryRecipes,
  getAllergenSubstitutes
};
