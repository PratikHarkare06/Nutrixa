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
const { callNvidiaNim, extractJsonFromText } = require("../utils/nvidiaNim");
const { FoodEntry } = require("../models/FoodEntry");
const { DailyWater } = require("../models/DailyWater");

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
    const { weight_kg, date, notes, body_fat_pct, muscle_mass_kg } = req.body;
    
    if (!weight_kg || !date) {
      return next(createAppError(400, "INVALID_DATA", "Weight and date are required."));
    }

    const weightNum = parseFloat(weight_kg);
    const bodyFatNum = body_fat_pct ? parseFloat(body_fat_pct) : null;
    const muscleMassNum = muscle_mass_kg ? parseFloat(muscle_mass_kg) : null;
    let imageUrl = null;
    
    if (req.file) {
      imageUrl = getImageUrl(req, req.file.filename);
    }

    const newLog = await ProgressLog.create({
      date,
      weight_kg: weightNum,
      body_fat_pct: bodyFatNum,
      muscle_mass_kg: muscleMassNum,
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

const getStreakDays = (datesArray) => {
  if (!datesArray || datesArray.length === 0) return 0;
  const uniqueDates = Array.from(new Set(datesArray)).sort().reverse();
  
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  let current = uniqueDates[0];
  if (current !== todayStr && current !== yesterdayStr) {
    return 0;
  }
  
  let streak = 0;
  let expectedDate = new Date(current);
  
  for (const d of uniqueDates) {
    const dStr = new Date(d).toISOString().split("T")[0];
    const expectedStr = expectedDate.toISOString().split("T")[0];
    if (dStr === expectedStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

const getWaterStreakDays = (logs, targetMl) => {
  if (!logs || logs.length === 0) return 0;
  
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  
  if (sortedLogs[0].date !== todayStr && sortedLogs[0].date !== yesterdayStr) {
    return 0;
  }
  
  let streak = 0;
  let expectedDate = new Date(sortedLogs[0].date);
  
  for (const log of sortedLogs) {
    const expectedStr = expectedDate.toISOString().split("T")[0];
    if (log.date === expectedStr) {
      if (log.water_intake_ml >= targetMl) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        if (log.date === todayStr) {
          expectedDate.setDate(expectedDate.getDate() - 1);
          continue;
        }
        break;
      }
    } else {
      break;
    }
  }
  return streak;
};

const getWeekDates = () => {
  const current = new Date();
  const day = current.getDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(current);
    d.setDate(current.getDate() + distanceToMonday + i);
    weekDates.push(d.toISOString().split("T")[0]);
  }
  return weekDates;
};

const getDashboardStats = async (req, res, next) => {
  try {
    const profile = await UserProfile.findOne(profileFilter).lean();
    const mappedProfile = profile ? mapUserProfileToResponse(profile) : defaultUserProfile;
    
    const workoutIntensity = mappedProfile.workoutIntensity || "moderate";
    const HYDRATION_GOALS = {
      rest: 2000,
      light: 2500,
      moderate: 3000,
      intense: 3500,
    };
    const waterGoal = HYDRATION_GOALS[workoutIntensity] || 2500;

    const foodEntries = await FoodEntry.find({}).lean();
    const datesArray = foodEntries.map(e => {
      const d = new Date(e.created_at || e.createdAt);
      return d.toISOString().split("T")[0];
    });

    const mealStreak = getStreakDays(datesArray);

    const weekDates = getWeekDates();
    const mealLogsWeek = weekDates.map(dateStr => datesArray.includes(dateStr));

    let loggedDaysCount = 0;
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }
    last7Days.forEach(dateStr => {
      if (datesArray.includes(dateStr)) loggedDaysCount++;
    });
    const consistencyScore = Math.round((loggedDaysCount / 7) * 100);

    const todayStr = new Date().toISOString().split("T")[0];
    const waterEntries = await DailyWater.find({}).lean();
    
    const todayWaterEntry = waterEntries.find(w => w.date === todayStr);
    const hydrationML = todayWaterEntry ? todayWaterEntry.water_intake_ml : 0;

    const hydrationStreak = getWaterStreakDays(waterEntries, waterGoal);
    const weeklyHydration = weekDates.map(dateStr => {
      const w = waterEntries.find(entry => entry.date === dateStr);
      return w ? w.water_intake_ml : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        workoutIntensity,
        waterGoal,
        hydrationML,
        hydrationStreak,
        weeklyHydration,
        mealStreak,
        mealLogsWeek,
        consistencyScore
      }
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    next(createAppError(500, "FETCH_FAILED", "Failed to fetch dashboard stats."));
  }
};

const updateWorkoutIntensity = async (req, res, next) => {
  try {
    const { intensity } = req.body;
    if (!intensity || !["rest", "light", "moderate", "intense"].includes(intensity)) {
      return next(createAppError(400, "INVALID_DATA", "Valid intensity is required."));
    }

    const HYDRATION_GOALS = {
      rest: 2000,
      light: 2500,
      moderate: 3000,
      intense: 3500,
    };
    const waterGoal = HYDRATION_GOALS[intensity];

    const profile = await UserProfile.findOneAndUpdate(
      profileFilter,
      { workout_intensity: intensity, water_goal_ml: waterGoal },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: mapUserProfileToResponse(profile)
    });
  } catch (error) {
    console.error("updateWorkoutIntensity error:", error);
    next(createAppError(500, "SAVE_FAILED", "Failed to update workout intensity."));
  }
};

const modifyDietPlanMeal = async (req, res, next) => {
  try {
    const { day, mealIndex, prompt } = req.body;
    if (!day || mealIndex === undefined || !prompt) {
      return next(createAppError(400, "INVALID_DATA", "day, mealIndex, and prompt are required."));
    }

    const profile = await UserProfile.findOne(profileFilter);
    if (!profile || !profile.diet_plan) {
      return next(createAppError(404, "NOT_FOUND", "Diet plan not found. Please generate a diet plan first."));
    }

    const dayPlan = profile.diet_plan.find(d => d.day.toLowerCase() === day.toLowerCase());
    if (!dayPlan || !dayPlan.meals || !dayPlan.meals[mealIndex]) {
      return next(createAppError(404, "NOT_FOUND", `Meal not found for ${day} at index ${mealIndex}.`));
    }

    const originalMeal = dayPlan.meals[mealIndex];

    const nimPrompt = `You are a world-class Indian nutritionist and chef.
The user wants to modify a specific meal in their weekly diet plan.
Original Meal details:
- Name: "${originalMeal.name}"
- Type: "${originalMeal.type}"
- Calories: ${originalMeal.calories} kcal
- Protein: ${originalMeal.protein}g
- Carbs: ${originalMeal.carbs}g
- Fat: ${originalMeal.fat}g
- Description: "${originalMeal.description}"

User request/customization instructions:
"${prompt}"

Please swap this meal with a replacement that is nutritionally balanced, fits their request, and maintains roughly similar macro-nutrients if possible, or matches the new request.
Return ONLY a valid JSON object representing the modified meal. The JSON object must strictly match this schema:
{
  "type": "${originalMeal.type}",
  "name": "Name of the new dish",
  "description": "Short appetizing 1-sentence description including portion size.",
  "calories": 450,
  "protein": 25,
  "carbs": 40,
  "fat": 12
}`;

    const textOutput = await callNvidiaNim(nimPrompt);
    const newMeal = extractJsonFromText(textOutput);

    dayPlan.meals[mealIndex] = newMeal;

    dayPlan.totalCalories = dayPlan.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    dayPlan.totalProtein = dayPlan.meals.reduce((sum, m) => sum + (m.protein || 0), 0);
    dayPlan.totalCarbs = dayPlan.meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
    dayPlan.totalFat = dayPlan.meals.reduce((sum, m) => sum + (m.fat || 0), 0);

    profile.markModified("diet_plan");
    await profile.save();

    res.status(200).json({ success: true, data: profile.diet_plan });
  } catch (error) {
    console.error("modifyDietPlanMeal error:", error);
    next(createAppError(500, "MODIFICATION_FAILED", "Failed to modify diet plan meal."));
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
  getAllergenSubstitutes,
  getDashboardStats,
  updateWorkoutIntensity,
  modifyDietPlanMeal
};
