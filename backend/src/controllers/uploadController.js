const { env } = require("../config/env");
const mongoose = require("mongoose");
const { FoodEntry, mapFoodEntryToAnalysis } = require("../models/FoodEntry");
const { analyzeFoodWithFatSecret, getNutritionalData, getFatSecretToken } = require("../services/fatSecretAnalysisService");
const { createAppError } = require("../utils/createAppError");
const { awardXP } = require("../services/gamificationService");
const { getImageUrl } = require("../utils/urlHelper");

const uploadImage = async (req, res, next) => {
  if (!req.file) {
    next(createAppError(400, "FILE_REQUIRED", "Please choose an image to upload."));
    return;
  }

  try {
    const imageUrl = getImageUrl(req, req.file.filename);
    const userMealType = (req.body.mealType || "").trim().toLowerCase();
    const uploadId = req.body.uploadId;
    const userDishName = (req.body.dishName || "").trim();
    
    const analysis = await analyzeFoodWithFatSecret(
      req.file.path, 
      req.file.mimetype, 
      imageUrl, 
      userMealType, 
      uploadId,
      userDishName
    );
    let responseData;
    if (req.user) {
      const savedEntry = await FoodEntry.create({
        userId: req.user._id,
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

      // Gamification
      await awardXP(req.user._id, "LOG_MEAL");
      responseData = mapFoodEntryToAnalysis(savedEntry, req);
    } else {
      // Guest mode - construct temp entry
      const tempEntry = {
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
        mealType: analysis.mealType,
        mealCategory: analysis.mealCategory,
        volumeSource: analysis.volumeSource,
      };
      responseData = mapFoodEntryToAnalysis(tempEntry, req);
    }

    res.status(200).json({
      success: true,
      data: responseData,
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
      data: mapFoodEntryToAnalysis(entry, req),
    });
  } catch (error) {
    next(error);
  }
};

const scanBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.body;
    if (!barcode) {
      return next(createAppError(400, "INVALID_DATA", "Barcode is required"));
    }

    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return next(createAppError(404, "NOT_FOUND", "Product not found in OpenFoodFacts database."));
    }

    const product = data.product;
    const nutriments = product.nutriments || {};
    
    const name = product.product_name || "Unknown Packaged Food";
    const brand = product.brands ? ` (${product.brands})` : "";
    const fullName = `${name}${brand}`;

    const calories100g = nutriments["energy-kcal_100g"] || nutriments.energy_100g / 4.184 || 0;
    const protein100g = nutriments.proteins_100g || 0;
    const carbs100g = nutriments.carbohydrates_100g || 0;
    const fat100g = nutriments.fat_100g || 0;
    const fiber100g = nutriments.fiber_100g || 0;
    
    // Extract actual package or serving quantity, defaulting to 100g if unknown
    const portionWeight = parseFloat(product.product_quantity) || parseFloat(product.serving_quantity) || 100;

    const portionCalories = (calories100g / 100) * portionWeight;
    const portionProtein = (protein100g / 100) * portionWeight;
    const portionCarbs = (carbs100g / 100) * portionWeight;
    const portionFat = (fat100g / 100) * portionWeight;
    const portionFiber = (fiber100g / 100) * portionWeight;

    const ingredientsMacros = new Map();
    ingredientsMacros.set(fullName.toLowerCase(), {
      calories: calories100g,
      protein: protein100g,
      carbs: carbs100g,
      fat: fat100g,
      fiber: fiber100g,
      source: "OpenFoodFacts",
      caloriesPerGram: calories100g / 100,
      portionWeight,
      portionCalories: Math.round(portionCalories),
      portionProtein: Math.round(portionProtein),
      portionCarbs: Math.round(portionCarbs),
      portionFat: Math.round(portionFat),
      portionFiber: Math.round(portionFiber)
    });

    let responseData;
    const tempEntry = {
      calories: Math.round(portionCalories),
      carbs: Math.round(portionCarbs),
      fat: Math.round(portionFat),
      fiber: Math.round(portionFiber),
      foods: [{ name: fullName, confidence: 1.0 }],
      image_url: product.image_url || product.image_front_url || "",
      protein: Math.round(portionProtein),
      volume: 0,
      weight: Math.round(portionWeight),
      ingredients_macros: ingredientsMacros,
      meal_type: "Snack",
      meal_category: "Packaged",
      volume_source: "barcode",
    };

    if (req.user) {
      tempEntry.userId = req.user._id;
      const savedEntry = await FoodEntry.create(tempEntry);
      
      // Gamification
      await awardXP(req.user._id, "LOG_MEAL");
      responseData = mapFoodEntryToAnalysis(savedEntry, req);
    } else {
      responseData = mapFoodEntryToAnalysis(tempEntry, req);
    }

    res.status(200).json({
      success: true,
      message: `Scanned: ${fullName}`,
      data: responseData,
    });

  } catch (error) {
    next(error);
  }
};

const { analyzePantryWithGemini, analyzeReceiptWithGemini } = require("../services/geminiAnalysisService");
const { UserProfile } = require("../models/UserProfile");

const analyzePantryImage = async (req, res, next) => {
  if (!req.file) {
    return next(createAppError(400, "FILE_REQUIRED", "Please choose an image of your fridge or pantry."));
  }

  try {
    const profile = await UserProfile.findOne({ profile_key: "primary" }).lean();
    
    const result = await analyzePantryWithGemini(
      req.file.path,
      req.file.mimetype,
      profile || {}
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(createAppError(500, "UPLOAD_FAILED", "Failed to analyze pantry image. Please try again."));
  }
};

const analyzeReceiptImage = async (req, res, next) => {
  if (!req.file) {
    return next(createAppError(400, "FILE_REQUIRED", "Please choose an image of your receipt."));
  }

  try {
    const result = await analyzeReceiptWithGemini(
      req.file.path,
      req.file.mimetype
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(createAppError(500, "UPLOAD_FAILED", "Failed to analyze receipt image. Please try again."));
  }
};

const calibrateMealWeight = async (req, res, next) => {
  const { analysisId, trueWeight } = req.body;
  if (!analysisId || !trueWeight || isNaN(trueWeight) || trueWeight <= 0) {
    return next(createAppError(400, "INVALID_DATA", "analysisId and a positive trueWeight are required."));
  }

  try {
    const entry = await FoodEntry.findById(analysisId);
    if (!entry) {
      return next(createAppError(404, "NOT_FOUND", "Logged meal not found."));
    }

    const estimatedWeight = entry.weight || 100;
    const ratio = trueWeight / estimatedWeight;

    // Scale overall entry values
    entry.weight = Math.round(trueWeight);
    entry.volume = Math.round((entry.volume || 0) * ratio);
    entry.calories = Math.round((entry.calories || 0) * ratio);
    entry.protein = Math.round((entry.protein || 0) * ratio);
    entry.carbs = Math.round((entry.carbs || 0) * ratio);
    entry.fat = Math.round((entry.fat || 0) * ratio);
    entry.fiber = Math.round((entry.fiber || 0) * ratio);

    // Scale each ingredient inside ingredients_macros
    if (entry.ingredients_macros) {
      for (const [key, val] of entry.ingredients_macros.entries()) {
        if (val) {
          val.portionWeight = Math.round((val.portionWeight || 0) * ratio);
          val.portionVolume = Math.round((val.portionVolume || 0) * ratio);
          val.portionCalories = Math.round((val.portionCalories || 0) * ratio);
          val.portionProtein = Math.round((val.portionProtein || 0) * ratio);
          val.portionCarbs = Math.round((val.portionCarbs || 0) * ratio);
          val.portionFat = Math.round((val.portionFat || 0) * ratio);
          val.portionFiber = Math.round((val.portionFiber || 0) * ratio);
          entry.ingredients_macros.set(key, val);
        }
      }
    }

    await entry.save();

    // Calibrate per-user calibrationOffset in UserProfile
    const profile = await UserProfile.findOne({ profile_key: "primary" });
    if (profile) {
      const oldOffset = profile.calibration_offset || 1.0;
      // Moving average: 70% weight to old offset, 30% weight to new ratio
      profile.calibration_offset = parseFloat((oldOffset * 0.7 + ratio * 0.3).toFixed(3));
      await profile.save();
      console.log(`[Calibration] Calibrated offset for user. Old: ${oldOffset}, New: ${profile.calibration_offset}, Ratio was: ${ratio}`);
    }

    res.status(200).json({
      success: true,
      message: "Calorie estimation calibrated successfully.",
      data: mapFoodEntryToAnalysis(entry, req),
    });
  } catch (err) {
    next(err);
  }
};

const editMealIngredients = async (req, res, next) => {
  const { analysisId, ingredients } = req.body;
  if (!Array.isArray(ingredients)) {
    return next(createAppError(400, "INVALID_DATA", "An ingredients array is required."));
  }

  try {
    let entry = null;
    if (analysisId && mongoose.Types.ObjectId.isValid(analysisId)) {
      entry = await FoodEntry.findById(analysisId);
    }

    let fatSecretToken = null;
    try {
      fatSecretToken = await getFatSecretToken();
    } catch (_) {}

    const newFoods = [];
    const newIngredientsMacros = new Map();
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalWeight = 0;

    for (const item of ingredients) {
      const name = (item.name || "").trim().toLowerCase();
      const weight = parseFloat(item.weight) || 100;
      if (!name) continue;

      newFoods.push({ name, confidence: 0.95 });
      totalWeight += weight;

      let details = null;
      if (entry && entry.ingredients_macros && entry.ingredients_macros.has(name)) {
        const oldVal = entry.ingredients_macros.get(name);
        details = {
          calories: oldVal.calories,
          protein: oldVal.protein,
          carbs: oldVal.carbs,
          fat: oldVal.fat,
          fiber: oldVal.fiber || 0,
          source: oldVal.source || "cached"
        };
      } else {
        details = await getNutritionalData(fatSecretToken, name);
      }

      if (!details) {
        details = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, source: "fallback" };
      }

      const scale = weight / 100;
      const portionCalories = Math.round(details.calories * scale);
      const portionProtein = Math.round(details.protein * scale);
      const portionCarbs = Math.round(details.carbs * scale);
      const portionFat = Math.round(details.fat * scale);
      const portionFiber = Math.round(details.fiber * scale);

      newIngredientsMacros.set(name, {
        calories: details.calories,
        protein: details.protein,
        carbs: details.carbs,
        fat: details.fat,
        fiber: details.fiber,
        source: details.source,
        portionWeight: weight,
        portionCalories,
        portionProtein,
        portionCarbs,
        portionFat,
        portionFiber
      });

      totalCalories += portionCalories;
      totalProtein += portionProtein;
      totalCarbs += portionCarbs;
      totalFat += portionFat;
      totalFiber += portionFiber;
    }

    if (entry) {
      entry.foods = newFoods;
      entry.weight = Math.round(totalWeight);
      entry.calories = Math.round(totalCalories);
      entry.protein = Math.round(totalProtein);
      entry.carbs = Math.round(totalCarbs);
      entry.fat = Math.round(totalFat);
      entry.fiber = Math.round(totalFiber);
      entry.ingredients_macros = newIngredientsMacros;

      await entry.save();

      res.status(200).json({
        success: true,
        message: "Meal ingredients updated successfully.",
        data: mapFoodEntryToAnalysis(entry, req),
      });
    } else {
      // Guest mode or temporary entry
      const tempEntry = {
        foods: newFoods,
        weight: Math.round(totalWeight),
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
        fiber: Math.round(totalFiber),
        ingredients_macros: newIngredientsMacros,
        id: analysisId || "",
        image_url: req.body.imageUrl || "",
      };

      res.status(200).json({
        success: true,
        message: "Meal ingredients updated successfully (temporary).",
        data: mapFoodEntryToAnalysis(tempEntry, req),
      });
    }
  } catch (err) {
    next(err);
  }
};

const getFoodAutocomplete = async (req, res, next) => {
  const query = (req.query.q || "").trim();
  if (!query) {
    return res.status(200).json({ success: true, data: [] });
  }

  try {
    const { searchAnuvaadAutocomplete } = require("../utils/anuvaadSearch");
    const results = searchAnuvaadAutocomplete(query);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  uploadImage, 
  correctIngredient, 
  scanBarcode, 
  analyzePantryImage,
  analyzeReceiptImage,
  calibrateMealWeight,
  editMealIngredients,
  getFoodAutocomplete
};
