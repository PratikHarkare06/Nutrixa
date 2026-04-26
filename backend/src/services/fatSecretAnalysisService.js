const fs = require("fs");
const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");
const { runYoloInference } = require("../utils/yoloInference");
const { getFoodDensity } = require("../utils/foodDensity");
const { runMiDaS } = require("../utils/midasDepth");

// ─── FatSecret OAuth2 Token ───────────────────────────────────────────────────

const getFatSecretToken = async () => {
  const clientId = (process.env.FATSECRET_CLIENT_ID || "").trim();
  const clientSecret = (process.env.FATSECRET_CLIENT_SECRET || "").trim();

  if (!clientId || !clientSecret) {
    throw new Error("FATSECRET_CONFIG_ERROR: credentials missing.");
  }

  const tokenResponse = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials&scope=basic",
  });

  if (!tokenResponse.ok) {
    const errBody = await tokenResponse.text();
    console.error("FatSecret token error:", errBody);
    return null; // non-fatal — we'll fall back to USDA
  }

  const data = await tokenResponse.json();
  return data.access_token;
};

// ─── FatSecret Nutritional Lookup ────────────────────────────────────────────

const getFatSecretNutritionalData = async (accessToken, foodName) => {
  try {
    const searchResponse = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(
        foodName
      )}&format=json&max_results=3`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const searchData = await searchResponse.json();

    if (searchData.error) {
      // error code 21 = IP not whitelisted; treat as soft failure
      console.warn(`FatSecret blocked for "${foodName}":`, searchData.error.message);
      return null;
    }

    if (!searchData.foods || !searchData.foods.food) {
      console.warn("FatSecret: no results for:", foodName);
      return null;
    }

    const foodArray = Array.isArray(searchData.foods.food)
      ? searchData.foods.food
      : [searchData.foods.food];

    if (foodArray.length === 0) return null;

    // Prefer a "Generic" entry over branded ones for clean macro data
    const preferred =
      foodArray.find((f) => f.food_type === "Generic") || foodArray[0];
    const foodId = preferred.food_id;

    const detailsResponse = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=food.get.v2&food_id=${foodId}&format=json`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const detailsData = await detailsResponse.json();
    if (!detailsData.food || !detailsData.food.servings) return null;

    const servingsData = detailsData.food.servings.serving;
    const servingArray = Array.isArray(servingsData) ? servingsData : [servingsData];

    // Prefer a 100 g serving; otherwise scale mathematically
    const serving100g = servingArray.find(
      (s) => parseFloat(s.metric_serving_amount || 0) === 100
    );
    const serving = serving100g || servingArray[0];

    const metricAmount = parseFloat(serving.metric_serving_amount || 100);
    const scaleTo100g = 100 / (metricAmount === 0 ? 100 : metricAmount);

    return {
      name: detailsData.food.food_name || foodName,
      source: "fatsecret",
      calories: Math.round(parseFloat(serving.calories || 0) * scaleTo100g),
      protein: Math.round(parseFloat(serving.protein || 0) * scaleTo100g),
      carbs: Math.round(parseFloat(serving.carbohydrate || 0) * scaleTo100g),
      fat: Math.round(parseFloat(serving.fat || 0) * scaleTo100g),
      fiber: Math.round(parseFloat(serving.fiber || 0) * scaleTo100g),
    };
  } catch (error) {
    console.error("FatSecret Lookup Error for", foodName, ":", error);
    return null;
  }
};

// ─── USDA FoodData Central Fallback ──────────────────────────────────────────

const getUSDANutritionalData = async (foodName) => {
  const apiKey = (process.env.USDA_API_KEY || "").trim();
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
        foodName
      )}&api_key=${apiKey}&pageSize=3&dataType=Foundation,SR%20Legacy`
    );

    if (!response.ok) {
      console.warn(`USDA failed for "${foodName}": HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.foods || data.foods.length === 0) return null;

    // Prefer Foundation > SR Legacy > Survey entries
    const food = data.foods[0];
    const nutrients = food.foodNutrients || [];

    const getNutrient = (id) => {
      const n = nutrients.find((n) => n.nutrientId === id);
      return n ? Math.round(n.value) : 0;
    };

    return {
      name: food.description,
      source: "usda",
      calories: getNutrient(1008),
      protein: getNutrient(1003),
      carbs: getNutrient(1005),
      fat: getNutrient(1004),
      fiber: getNutrient(1079),
    };
  } catch (error) {
    console.error("USDA Lookup Error for", foodName, ":", error);
    return null;
  }
};

// ─── Unified Nutrition Lookup: FatSecret → USDA fallback ─────────────────────

const getNutritionalData = async (fatSecretToken, foodName) => {
  // 1. Try FatSecret first (richer data, better food names)
  if (fatSecretToken) {
    const fsResult = await getFatSecretNutritionalData(fatSecretToken, foodName);
    if (fsResult) return fsResult;
  }

  // 2. Fall back to USDA FoodData Central
  const usdaResult = await getUSDANutritionalData(foodName);
  if (usdaResult) return usdaResult;

  return null;
};

// ─── Gemini: Exhaustive Ingredient Detection ──────────────────────────────────

const detectIngredientsWithGemini = async (imagePath, mimeType) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return ["Mixed Meal"];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    const prompt = `You are an expert chef and nutritionist. Carefully analyze this food image.

List EVERY distinct ingredient or food component you can detect, including:
- Main protein sources (meat, fish, eggs, legumes, tofu, etc.)
- Vegetables and greens
- Grains, pasta, rice, or bread components
- Sauces, dressings, gravies, condiments
- Dairy components (cheese, cream, butter, yogurt)
- Fruits or garnishes
- Nuts or seeds
- Cooking fats or oils (only if visually evident)
- Spices or herbs (only if clearly visible)

Rules:
1. Be exhaustive — list every visible component, even small ones.
2. Use simple, common English names (e.g. "mozzarella cheese", "cherry tomato", "olive oil").
3. Do NOT use vague terms like "food" or "meal" — be specific.
4. Output ONLY a raw JSON array of strings, nothing else.

Example: ["grilled chicken breast", "white rice", "steamed broccoli", "soy sauce", "sesame seeds"]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text;
    const ingredients = JSON.parse(textOutput);
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      return ingredients.map((s) => String(s).trim()).filter(Boolean);
    }
    return ["Mixed Meal"];
  } catch (error) {
    console.error("Gemini ingredient detection error:", error);
    return ["Mixed Meal"];
  }
};

// ─── Merge & Deduplicate Ingredient Lists ────────────────────────────────────

const mergeIngredients = (geminiList, yoloList) => {
  const seen = new Set();
  const merged = [];

  const add = (name) => {
    const key = name.toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push(name.trim());
    }
  };

  // Gemini gets priority (more descriptive names)
  for (const name of geminiList) add(name);

  // YOLO fills gaps (skip generic fallback labels like "ingredient_0")
  for (const { name } of yoloList) {
    if (!name.startsWith("ingredient_")) add(name);
  }

  return merged;
};

// ─── Main Analysis Function ───────────────────────────────────────────────────

const analyzeFoodWithFatSecret = async (imagePath, mimeType, imageUrl) => {
  // 1. Run YOLO + Gemini + MiDaS in parallel for speed
  const [yoloData, geminiIngredients, midasResult] = await Promise.all([
    runYoloInference(imagePath),
    detectIngredientsWithGemini(imagePath, mimeType),
    runMiDaS(imagePath, 0.5), // bbox_ratio refined below after YOLO
  ]);

  const bboxRatio = yoloData.ratio;
  const yoloIngredients = yoloData.detectedIngredients || [];

  // 2. Merge both ingredient sources
  const allIngredients = mergeIngredients(geminiIngredients, yoloIngredients);
  console.log(`[NutriVision] ${allIngredients.length} unique ingredients detected:`, allIngredients);

  // 3. Get FatSecret token (non-fatal if it fails — USDA will cover)
  let fatSecretToken = null;
  try {
    fatSecretToken = await getFatSecretToken();
    if (fatSecretToken) {
      console.log("[NutriVision] FatSecret token obtained ✓");
    }
  } catch (_) {
    console.warn("[NutriVision] FatSecret auth failed — using USDA only.");
  }

  // 4. Build confidence map from YOLO for display
  const yoloConfidenceMap = {};
  for (const { name, confidence } of yoloIngredients) {
    yoloConfidenceMap[name.toLowerCase()] = confidence;
  }

  // 5. Lookup nutrition for every ingredient (batched, max 6 concurrent)
  const BATCH_SIZE = 6;
  const detectedFoods = [];
  const ingredientsMacros = {};

  for (let i = 0; i < allIngredients.length; i += BATCH_SIZE) {
    const batch = allIngredients.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((ingredient) => getNutritionalData(fatSecretToken, ingredient))
    );

    for (let j = 0; j < batch.length; j++) {
      const nutriments = results[j];
      const originalName = batch[j];
      const confidence = yoloConfidenceMap[originalName.toLowerCase()] ?? 0.88;

      if (nutriments) {
        const key = nutriments.name.toLowerCase();
        detectedFoods.push({ name: nutriments.name, confidence });
        ingredientsMacros[key] = {
          calories: nutriments.calories,
          protein: nutriments.protein,
          fat: nutriments.fat,
          carbs: nutriments.carbs,
          fiber: nutriments.fiber,
          source: nutriments.source,
        };
        console.log(`  ✓ ${nutriments.name} [${nutriments.source}] — ${nutriments.calories} kcal/100g`);
      } else {
        // Surface the ingredient even without macro data
        console.warn(`  ✗ No nutrition data found for: "${originalName}"`);
        detectedFoods.push({ name: originalName, confidence: 0.7 });
        ingredientsMacros[originalName.toLowerCase()] = {
          calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, source: "unknown",
        };
      }
    }
  }

  // 6. Fallback: nothing detected at all
  if (detectedFoods.length === 0) {
    detectedFoods.push({ name: "Mixed Meal", confidence: 0.5 });
    ingredientsMacros["mixed meal"] = {
      calories: 250, protein: 10, fat: 10, carbs: 20, fiber: 2, source: "fallback",
    };
  }

  // 7. Estimate total portion weight & volume
  //    Priority: MiDaS (depth-based) → density lookup fallback
  let calculatedWeight, totalVolume;

  if (midasResult.success && midasResult.volume_cm3 > 0) {
    // MiDaS gives us real depth-derived volume and weight
    totalVolume = midasResult.volume_cm3;
    calculatedWeight = midasResult.weight_g;
    console.log(`[NutriVision] Volume source: MiDaS → ${totalVolume} cm³, ${calculatedWeight} g`);
  } else {
    // Fallback: YOLO bbox ratio × ingredient count × 250 g/ingredient
    const maxEstimatedWeight = detectedFoods.length * 250;
    calculatedWeight = Math.max(50, bboxRatio * maxEstimatedWeight);
    totalVolume = 0; // computed per-ingredient below using density
    console.log(`[NutriVision] Volume source: density fallback → weight ${calculatedWeight} g`);
  }

  const weightPerIngredient = calculatedWeight / detectedFoods.length;

  // 8. Scale 100 g macros → actual portion per ingredient
  //    Volume per ingredient (when MiDaS failed): Weight / density
  const processedFoods = detectedFoods.map((food) => {
    const key = food.name.toLowerCase();
    const m = ingredientsMacros[key] || {
      calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0,
    };

    const portionCalories = (m.calories / 100) * weightPerIngredient;
    const portionProtein  = (m.protein  / 100) * weightPerIngredient;
    const portionCarbs    = (m.carbs    / 100) * weightPerIngredient;
    const portionFat      = (m.fat      / 100) * weightPerIngredient;
    const portionFiber    = (m.fiber    / 100) * weightPerIngredient;

    // Per-ingredient volume (used only when MiDaS fallback)
    const density = getFoodDensity(food.name);
    const portionVolume = midasResult.success
      ? Math.round(totalVolume / detectedFoods.length) // split MiDaS total evenly
      : weightPerIngredient / density;                 // density fallback

    if (!midasResult.success) totalVolume += portionVolume;

    // Enrich macros entry with per-gram density + actual portion values
    ingredientsMacros[key] = {
      ...m,
      caloriesPerGram: parseFloat((m.calories / 100).toFixed(2)),
      proteinPerGram:  parseFloat((m.protein  / 100).toFixed(2)),
      carbsPerGram:    parseFloat((m.carbs    / 100).toFixed(2)),
      fatPerGram:      parseFloat((m.fat      / 100).toFixed(2)),
      fiberPerGram:    parseFloat((m.fiber    / 100).toFixed(2)),
      density,
      portionWeight:   Math.round(weightPerIngredient),
      portionVolume:   Math.round(portionVolume),
      portionCalories: Math.round(portionCalories),
      portionProtein:  Math.round(portionProtein),
      portionCarbs:    Math.round(portionCarbs),
      portionFat:      Math.round(portionFat),
      portionFiber:    Math.round(portionFiber),
    };

    console.log(
      `  → ${food.name}: ${Math.round(weightPerIngredient)}g | ` +
      `${Math.round(portionVolume)} cm³ | ${Math.round(portionCalories)} kcal`
    );

    return {
      ...food,
      calculatedCalories: portionCalories,
      calculatedProtein:  portionProtein,
      calculatedCarbs:    portionCarbs,
      calculatedFat:      portionFat,
      calculatedFiber:    portionFiber,
    };
  });

  const sum = (key) => processedFoods.reduce((acc, f) => acc + f[key], 0);

  return {
    id: crypto.randomUUID(),
    imageUrl,
    foods: detectedFoods,
    ingredients_macros: ingredientsMacros,
    macros: {
      calories: Math.round(sum("calculatedCalories")),
      protein:  Math.round(sum("calculatedProtein")),
      carbs:    Math.round(sum("calculatedCarbs")),
      fat:      Math.round(sum("calculatedFat")),
      fiber:    Math.round(sum("calculatedFiber")),
    },
    volume: Math.round(totalVolume),
    weight: Math.round(calculatedWeight),
    volumeSource: midasResult.success ? "midas" : "density",
    createdAt: new Date().toISOString(),
  };
};

module.exports = { analyzeFoodWithFatSecret };
