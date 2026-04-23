const { env } = require("../config/env");
const { FoodEntry, mapFoodEntryToAnalysis } = require("../models/FoodEntry");
const { buildMockAnalysis } = require("../services/mockAnalysisService");
const { createAppError } = require("../utils/createAppError");

const uploadImage = async (req, res, next) => {
  if (!req.file) {
    next(createAppError(400, "FILE_REQUIRED", "Please choose an image to upload."));
    return;
  }

  try {
    const imageUrl = `${env.appUrl}/uploads/${req.file.filename}`;
    const analysis = buildMockAnalysis(imageUrl);
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
    });

    res.status(200).json({
      success: true,
      data: mapFoodEntryToAnalysis(savedEntry),
    });
  } catch (_error) {
    next(createAppError(500, "UPLOAD_FAILED", "Upload failed. Please try again."));
  }
};

module.exports = { uploadImage };
