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
    const analysis = await analyzeFoodWithFatSecret(req.file.path, req.file.mimetype, imageUrl, userMealType, uploadId);
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

const correctIngredient = async (req, res, next) => {
  try {
    const { wrongName, correctName } = req.body;
    if (!wrongName || !correctName) {
      return next(createAppError(400, "INVALID_DATA", "Missing wrongName or correctName"));
    }
    
    addUserCorrection(wrongName, correctName);
    
    res.status(200).json({
      success: true,
      message: `Memory updated: ${wrongName} will now be identified as ${correctName}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImage, correctIngredient };
