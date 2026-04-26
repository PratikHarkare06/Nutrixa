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
    const analysis = await analyzeFoodWithFatSecret(req.file.path, req.file.mimetype, imageUrl);
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
    });

    res.status(200).json({
      success: true,
      data: mapFoodEntryToAnalysis(savedEntry),
    });
  } catch (error) {
    if (error.message.includes("FATSECRET_CONFIG_ERROR")) {
      next(createAppError(500, "CONFIG_ERROR", "FatSecret API keys are missing. Please configure them."));
    } else {
      next(createAppError(500, "UPLOAD_FAILED", "Upload failed or AI analysis error. Please try again."));
    }
  }
};

module.exports = { uploadImage };
