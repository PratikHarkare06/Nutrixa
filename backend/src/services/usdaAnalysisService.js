const fs = require("fs");
const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");
const { runYoloInference } = require("../utils/yoloInference");

const searchUSDAFood = async (query, apiKey) => {
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
        query
      )}&api_key=${apiKey}&pageSize=1`
    );

    if (!response.ok) {
      console.warn(`USDA API failed for query: ${query}`);
      return null;
    }

    const data = await response.json();
    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0];
      
      const nutrients = food.foodNutrients || [];
      const getNutrient = (id) => {
        const n = nutrients.find((n) => n.nutrientId === id);
        return n ? n.value : 0;
      };

      return {
        name: food.description,
        calories: getNutrient(1008),
        protein: getNutrient(1003),
        carbs: getNutrient(1005),
        fat: getNutrient(1004),
        fiber: getNutrient(1079),
      };
    }
  } catch (error) {
    console.error("USDA API Error:", error);
  }
  return null;
};

const detectIngredientsWithGemini = async (imagePath, mimeType) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return ["Pizza"];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    const prompt = `Analyze this food image. Provide a JSON list of the main ingredients you see.
Output ONLY a JSON array of strings, for example: ["mozzarella", "tomato", "basil", "pizza dough"]. Keep the ingredients simple.`;

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
    return Array.isArray(ingredients) ? ingredients : ["Mixed Meal"];
  } catch (error) {
    console.error("Gemini API Error (fallback to generic):", error);
    return ["Mixed Meal"];
  }
};

const analyzeFoodWithUSDA = async (imagePath, mimeType, imageUrl) => {
  const usdaApiKey = process.env.USDA_API_KEY;
  
  if (!usdaApiKey) {
    throw new Error("USDA_API_KEY is not configured in environment variables.");
  }

  // 1. Detect ingredients
  const ingredients = await detectIngredientsWithGemini(imagePath, mimeType);
  
  // 2. Run YOLO to get bbox area ratio for portion sizing
  const yoloData = await runYoloInference(imagePath);
  const bboxRatio = yoloData.ratio;
  
  // Estimate max weight (e.g. 250g per detected main ingredient max)
  const maxEstimatedWeight = ingredients.length * 250; 
  
  // Apply Option B logic: weight = (bbox_area / image_area) * estimated_total_weight
  const calculatedWeight = bboxRatio * maxEstimatedWeight;

  // 3. Query USDA for each ingredient and map the 100g macros
  let totalMacros100g = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const detectedFoods = [];
  const ingredientsMacros = {};

  for (const ingredient of ingredients) {
    const nutriments = await searchUSDAFood(ingredient, usdaApiKey);
    if (nutriments) {
      detectedFoods.push({
        name: nutriments.name,
        confidence: 0.9,
      });
      
      ingredientsMacros[nutriments.name.toLowerCase()] = {
        calories: nutriments.calories,
        protein: nutriments.protein,
        fat: nutriments.fat,
        carbs: nutriments.carbs
      };

      totalMacros100g.calories += nutriments.calories;
      totalMacros100g.protein += nutriments.protein;
      totalMacros100g.carbs += nutriments.carbs;
      totalMacros100g.fat += nutriments.fat;
      totalMacros100g.fiber += nutriments.fiber;
    }
  }

  if (detectedFoods.length === 0) {
    const fallbackName = ingredients[0] || "Unknown Food";
    detectedFoods.push({ name: fallbackName, confidence: 0.5 });
    ingredientsMacros[fallbackName.toLowerCase()] = {
      calories: 250,
      protein: 10,
      fat: 10,
      carbs: 20
    };
  }

  // 🧮 Step 4: Calculate Calories and Macros per ingredient
  const weight_in_grams = calculatedWeight / detectedFoods.length;
  
  const processedFoods = detectedFoods.map(food => {
    const macros100g = ingredientsMacros[food.name.toLowerCase()];
    
    return {
      ...food,
      // Formula: macro = (macro_per_100g / 100) * weight_in_grams
      calculatedCalories: (macros100g.calories / 100) * weight_in_grams,
      calculatedProtein: (macros100g.protein / 100) * weight_in_grams,
      calculatedCarbs: (macros100g.carbs / 100) * weight_in_grams,
      calculatedFat: (macros100g.fat / 100) * weight_in_grams,
      calculatedFiber: ((macros100g.fiber || 0) / 100) * weight_in_grams,
    };
  });

  // 🧩 Step 5: Combine All Ingredients
  const totalCalories = processedFoods.reduce((sum, item) => sum + item.calculatedCalories, 0);
  const totalProtein = processedFoods.reduce((sum, item) => sum + item.calculatedProtein, 0);
  const totalCarbs = processedFoods.reduce((sum, item) => sum + item.calculatedCarbs, 0);
  const totalFat = processedFoods.reduce((sum, item) => sum + item.calculatedFat, 0);
  const totalFiber = processedFoods.reduce((sum, item) => sum + item.calculatedFiber, 0);

  return {
    id: crypto.randomUUID(),
    imageUrl,
    // Return original stripped foods structure as expected by DB/frontend
    foods: detectedFoods,
    ingredients_macros: ingredientsMacros,
    macros: {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      fiber: Math.round(totalFiber),
    },
    volume: Math.round(calculatedWeight * 1.2),
    weight: Math.round(calculatedWeight),
    createdAt: new Date().toISOString(),
  };
};

module.exports = { analyzeFoodWithUSDA };
