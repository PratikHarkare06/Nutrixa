const fs = require("fs");
const { UserProfile } = require("../models/UserProfile");
const { FoodEntry, mapFoodEntryToAnalysis } = require("../models/FoodEntry");
const { parseVoiceMealWithGemini, transcribeAudioWithGemini } = require("../services/geminiAnalysisService");
const { createAppError } = require("../utils/createAppError");
const { awardXP } = require("../services/gamificationService");

const parseVoiceLog = async (req, res, next) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return next(createAppError(400, "INVALID_DATA", "Voice transcript is required."));
    }

    const profile = await UserProfile.findOne({ profile_key: "primary" }).lean();
    const analysis = await parseVoiceMealWithGemini(transcript.trim(), profile || {});

    // Convert ingredients_macros plain object to Map for Mongoose
    const ingredientsMacrosMap = new Map();
    if (analysis.ingredients_macros) {
      Object.entries(analysis.ingredients_macros).forEach(([key, val]) => {
        ingredientsMacrosMap.set(key.toLowerCase(), val);
      });
    }

    const savedEntry = await FoodEntry.create({
      calories: analysis.macros.calories,
      carbs: analysis.macros.carbs,
      fat: analysis.macros.fat,
      fiber: analysis.macros.fiber,
      foods: analysis.foods,
      image_url: analysis.imageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80",
      protein: analysis.macros.protein,
      volume: analysis.volume || 0,
      weight: analysis.weight || 350,
      ingredients_macros: ingredientsMacrosMap,
      meal_type: analysis.mealType || "Lunch",
      meal_category: analysis.mealCategory || "Custom",
      volume_source: "voice",
    });

    // Award XP gamification
    await awardXP(null, "LOG_MEAL");

    res.status(200).json({
      success: true,
      data: mapFoodEntryToAnalysis(savedEntry, req),
    });
  } catch (error) {
    console.error("Voice Log Controller Error:", error);
    next(createAppError(500, "PARSE_FAILED", "Failed to parse voice log. Please try again."));
  }
};

const parseVoiceAudio = async (req, res, next) => {
  if (!req.file) {
    return next(createAppError(400, "INVALID_FILE", "Audio file is required."));
  }

  const audioPath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    // 1. Transcribe the raw audio using Gemini
    const transcript = await transcribeAudioWithGemini(audioPath, mimeType);

    if (!transcript || !transcript.trim()) {
      return next(createAppError(400, "TRANSCRIPTION_FAILED", "No clear speech detected in the audio. Please try speaking clearly or typing manually."));
    }

    // 2. Parse the transcript into a food entry using Gemini
    const profile = await UserProfile.findOne({ profile_key: "primary" }).lean();
    const analysis = await parseVoiceMealWithGemini(transcript.trim(), profile || {});

    // Convert ingredients_macros plain object to Map for Mongoose
    const ingredientsMacrosMap = new Map();
    if (analysis.ingredients_macros) {
      Object.entries(analysis.ingredients_macros).forEach(([key, val]) => {
        ingredientsMacrosMap.set(key.toLowerCase(), val);
      });
    }

    const savedEntry = await FoodEntry.create({
      calories: analysis.macros.calories,
      carbs: analysis.macros.carbs,
      fat: analysis.macros.fat,
      fiber: analysis.macros.fiber,
      foods: analysis.foods,
      image_url: analysis.imageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80",
      protein: analysis.macros.protein,
      volume: analysis.volume || 0,
      weight: analysis.weight || 350,
      ingredients_macros: ingredientsMacrosMap,
      meal_type: analysis.mealType || "Lunch",
      meal_category: analysis.mealCategory || "Custom",
      volume_source: "voice",
    });

    // Award XP gamification
    await awardXP(null, "LOG_MEAL");

    // Clean up temporary audio file asynchronously
    fs.unlink(audioPath, (err) => {
      if (err) console.error("Temporary file cleanup error:", err);
    });

    res.status(200).json({
      success: true,
      data: {
        ...mapFoodEntryToAnalysis(savedEntry, req),
        transcript: transcript
      },
    });
  } catch (error) {
    // Clean up temporary audio file in case of error
    fs.unlink(audioPath, (err) => {
      if (err) console.error("Temporary file cleanup error:", err);
    });
    console.error("Voice Audio Controller Error:", error);
    next(createAppError(500, "PARSE_FAILED", `Failed to process audio log: ${error.message}`));
  }
};

module.exports = { parseVoiceLog, parseVoiceAudio };
