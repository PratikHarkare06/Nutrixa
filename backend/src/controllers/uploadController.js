const { env } = require("../config/env");
const { FoodEntry, mapFoodEntryToAnalysis } = require("../models/FoodEntry");
const { analyzeFoodWithFatSecret } = require("../services/fatSecretAnalysisService");
const { createAppError } = require("../utils/createAppError");

const uploadImage = async (req, res, next) => {
  if (!req.file) {
    next(createAppError(400, "FILE_REQUIRED", "Please choose an image to upload."));
    return;
  }

  try {
    const imageUrl = `${env.appUrl}/uploads/${req.file.filename}`;
    const userMealType = (req.body.mealType || "").trim().toLowerCase();
    const uploadId = req.body.uploadId;
    
    const analysis = await analyzeFoodWithFatSecret(
      req.file.path, 
      req.file.mimetype, 
      imageUrl, 
      userMealType, 
      uploadId
    );
    const savedEntry = await FoodEntry.create({
      calories: analysis.macros.calories,
      carbs: analysis.macros.carbs,
      fat: analysis.macros.fat,
      fiber: analysis.macros.fiber,
      foods: analysis.foods,
      image_url: analysis.imageUrl,
      protein: analysis.macros.protein,
      volume: analysis.volume,
      weight: analysis.weight,
      ingredients_macros: analysis.ingredients_macros,
      meal_type: analysis.mealType,
      meal_category: analysis.mealCategory,
      volume_source: analysis.volumeSource,
    });

    res.status(200).json({
      success: true,
      data: mapFoodEntryToAnalysis(savedEntry),
    });
  } catch (error) {
    if (error.message?.includes("FATSECRET_CONFIG_ERROR")) {
      next(createAppError(500, "CONFIG_ERROR", "FatSecret API keys are missing. Please configure them."));
    } else if (error.message?.includes("ANALYSIS_UNAVAILABLE")) {
      next(createAppError(503, "RATE_LIMITED", "AI analysis is temporarily unavailable. Please wait a moment and try again."));
    } else {
      next(createAppError(500, "UPLOAD_FAILED", "Upload failed or AI analysis error. Please try again."));
    }
  }
};

const { addUserCorrection } = require("../utils/userMemory");
const { getFatSecretToken, getNutritionalData } = require("../services/fatSecretAnalysisService");

const correctIngredient = async (req, res, next) => {
  try {
    const { analysisId, originalName, correctedName } = req.body;
    if (!analysisId || !originalName || !correctedName) {
      return next(createAppError(400, "INVALID_DATA", "Missing analysisId, originalName or correctedName"));
    }
    
    // 1. Permanently learn this for future scans
    addUserCorrection(originalName, correctedName);
    
    // 2. Load the current scan
    const entry = await FoodEntry.findById(analysisId);
    if (!entry) {
      return next(createAppError(404, "NOT_FOUND", "Analysis entry not found"));
    }

    // 3. Find the exact ingredient in the DB that we need to replace
    const foodIndex = entry.foods.findIndex(f => f.name.toLowerCase() === originalName.toLowerCase() || f.originalName === originalName);
    if (foodIndex === -1) {
      return next(createAppError(404, "NOT_FOUND", "Ingredient not found in this meal"));
    }

    const oldName = entry.foods[foodIndex].name;
    const oldKey = oldName.toLowerCase();
    
    // 4. Extract the old macros and portion weight
    const oldMacros = entry.ingredients_macros.get(oldKey);
    if (!oldMacros) {
      return next(createAppError(500, "DATA_ERROR", "Could not find macro data for old ingredient"));
    }
    
    const portionWeight = oldMacros.portionWeight || 100;

    // 5. Fetch the 100g nutritional data for the newly corrected ingredient
    const fatSecretToken = await getFatSecretToken().catch(() => null);
    const nutriments = await getNutritionalData(fatSecretToken, correctedName);
    
    if (!nutriments) {
      return next(createAppError(404, "NOT_FOUND", `Could not find nutritional data for "${correctedName}"`));
    }

    // 6. Calculate the new portion macros based on the original weight
    const newPortionCalories = (nutriments.calories / 100) * portionWeight;
    const newPortionProtein = (nutriments.protein / 100) * portionWeight;
    const newPortionCarbs = (nutriments.carbs / 100) * portionWeight;
    const newPortionFat = (nutriments.fat / 100) * portionWeight;
    const newPortionFiber = (nutriments.fiber / 100) * portionWeight;

    // 7. Adjust the Total Meal Macros
    entry.calories = Math.max(0, entry.calories - oldMacros.portionCalories + newPortionCalories);
    entry.protein = Math.max(0, entry.protein - oldMacros.portionProtein + newPortionProtein);
    entry.carbs = Math.max(0, entry.carbs - oldMacros.portionCarbs + newPortionCarbs);
    entry.fat = Math.max(0, entry.fat - oldMacros.portionFat + newPortionFat);
    entry.fiber = Math.max(0, entry.fiber - oldMacros.portionFiber + newPortionFiber);

    // 8. Update the Ingredient Details
    entry.foods[foodIndex].name = nutriments.name;
    entry.foods[foodIndex].confidence = 1.0; // User confirmed, so 100% confidence
    
    // Replace the macro map key
    entry.ingredients_macros.delete(oldKey);
    entry.ingredients_macros.set(nutriments.name.toLowerCase(), {
      calories: nutriments.calories,
      protein: nutriments.protein,
      carbs: nutriments.carbs,
      fat: nutriments.fat,
      fiber: nutriments.fiber,
      source: nutriments.source,
      caloriesPerGram: parseFloat((nutriments.calories / 100).toFixed(2)),
      portionWeight: Math.round(portionWeight),
      portionCalories: Math.round(newPortionCalories),
      portionProtein: Math.round(newPortionProtein),
      portionCarbs: Math.round(newPortionCarbs),
      portionFat: Math.round(newPortionFat),
      portionFiber: Math.round(newPortionFiber)
    });

    // 9. Save to Database
    await entry.save();

    // 10. Return the freshly updated JSON analysis to React
    res.status(200).json({
      success: true,
      message: `Updated to ${nutriments.name}`,
      data: mapFoodEntryToAnalysis(entry),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImage, correctIngredient };
