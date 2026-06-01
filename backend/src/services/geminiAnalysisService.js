const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const crypto = require("crypto");

const analyzeFoodImageWithGemini = async (imagePath, mimeType, imageUrl) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  const prompt = `You are a professional nutritionist and image recognition AI. Analyze this food image and estimate the nutritional content.
Please output ONLY a valid JSON object without any markdown wrapping or additional text.
The JSON must strictly follow this structure:
{
  "foods": [
    {
      "name": "Food Name (e.g., Grilled Chicken, Brown Rice, etc)",
      "confidence": 0.95
    }
  ],
  "macros": {
    "calories": 400,
    "protein": 20,
    "carbs": 30,
    "fat": 15,
    "fiber": 5
  },
  "volume": 200,
  "weight": 250
}
Ensure the estimated weight is in grams (g) and volume is in cubic centimeters (cm³). Confidence should be a float between 0 and 1.`;

  try {
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
    const parsedData = JSON.parse(textOutput);

    // Build final analysis object expected by the rest of the application
    return {
      id: crypto.randomUUID(),
      imageUrl,
      foods: parsedData.foods || [],
      macros: parsedData.macros || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      },
      volume: parsedData.volume || 0,
      weight: parsedData.weight || 0,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze food image with Gemini.");
  }
};

const getMealSuggestions = async (remainingCalories, remainingProtein) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `You are an expert Indian nutritionist. The user has ${remainingCalories} kcal and ${remainingProtein}g of protein left for their daily target.
Suggest 3 specific, realistic Indian meals (or snacks) they can eat right now to hit these targets as closely as possible without going over by more than 10%.
Return a JSON array of 3 objects, each with:
- "name": String (Dish name)
- "description": String (Short 1-sentence appetizing description with portion sizes)
- "calories": Number
- "protein": Number`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Advisor Error:", error);
    return [];
  }
};

const generatePersonalizedDietPlan = async (profile, metrics) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });
  
  const restrictions = profile.dietary_restrictions?.length ? profile.dietary_restrictions.join(", ") : "None";
  const allergies = profile.food_allergies?.length ? profile.food_allergies.join(", ") : "None";
  const targetCalories = metrics.maintenanceCalories; // Use maintenance or adjust based on a goal if we had one.
  const dietMode = profile.diet_mode || "Balanced";

  const prompt = `You are a world-class Indian nutritionist.
Create a detailed 7-day personalized meal plan for a user with the following profile:
- Age: ${profile.age}, Gender: ${profile.gender}, Weight: ${profile.weight_kg}kg, Height: ${profile.height_cm}cm
- Activity Level: ${profile.activity_level}
- Target Daily Calories: ~${targetCalories} kcal
- Diet Mode: ${dietMode}
- Dietary Restrictions: ${restrictions}
- Allergies: ${allergies}

Return ONLY a valid JSON array of exactly 7 objects (one for each day, Monday to Sunday). Each day object must exactly follow this schema:
{
  "day": "Monday",
  "totalCalories": 2000,
  "totalProtein": 120,
  "totalCarbs": 200,
  "totalFat": 60,
  "meals": [
    {
      "type": "Breakfast",
      "name": "Oats Idli with Sambar",
      "description": "Healthy oats idli served with protein-rich lentil sambar.",
      "calories": 400,
      "protein": 15,
      "carbs": 60,
      "fat": 10
    },
    // ... exactly 4 meals per day: Breakfast, Lunch, Snack, Dinner
  ]
}

Ensure the daily macros closely sum up to the Target Daily Calories. Make the meals realistic, emphasizing Indian cuisine where appropriate while strictly adhering to the user's Diet Mode and allergies. Do not return anything outside the JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Diet Plan Error:", error);
    throw new Error("Failed to generate diet plan");
  }
};

const analyzePantryWithGemini = async (imagePath, mimeType, profile) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  const restrictions = profile?.dietary_restrictions?.length ? profile.dietary_restrictions.join(", ") : "None";
  const allergies = profile?.food_allergies?.length ? profile.food_allergies.join(", ") : "None";
  const dietMode = profile?.diet_mode || "Balanced";

  const prompt = `You are a world-class Indian nutritionist and master chef.
Analyze this image of a fridge or pantry. Identify all the usable raw ingredients you can see.
Then, generate 3 healthy, appetizing recipes that the user can cook using PRIMARILY these ingredients (you may assume basic staples like oil, salt, pepper, and common Indian spices are available).

The user's profile:
- Diet Mode: ${dietMode}
- Dietary Restrictions: ${restrictions}
- Allergies: ${allergies}

All 3 recipes MUST strictly adhere to the Diet Mode and Allergies. Do not suggest anything that violates these rules.
Return ONLY a valid JSON object matching this exact schema:
{
  "identifiedIngredients": ["Tomato", "Onion", "Eggs", "Spinach"],
  "recipes": [
    {
      "name": "Spinach & Tomato Masala Omelette",
      "description": "A protein-packed spiced omelette using fresh spinach and tomatoes.",
      "prepTime": "15 mins",
      "calories": 250,
      "protein": 18,
      "carbs": 5,
      "fat": 15,
      "ingredients": ["3 Eggs", "1/2 cup chopped Spinach", "1 small Tomato, diced", "Pinch of turmeric and chili powder"],
      "instructions": ["Beat the eggs with spices.", "Sauté onions and tomatoes until soft.", "Add spinach and cook until wilted.", "Pour in eggs and cook until set."]
    }
  ]
}
Do not return any markdown formatting outside of the JSON.`;

  try {
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
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Pantry Error:", error);
    throw new Error("Failed to analyze pantry image.");
  }
};

const generateGroceryList = async (dietPlan) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a highly organized culinary assistant. I am providing a 7-day diet plan in JSON format.
Your task is to extract all the required raw ingredients to cook these meals and group them into a structured grocery shopping list.
Deduplicate similar items and combine quantities where logical (e.g., "Onions - 5 large", "Chicken Breast - 1.5kg").

Diet Plan:
${JSON.stringify(dietPlan, null, 2)}

Return ONLY a valid JSON array of category objects matching this exact schema:
[
  {
    "category": "Produce",
    "items": [
      { "name": "Onions", "amount": "5 large", "checked": false },
      { "name": "Spinach", "amount": "2 bunches", "checked": false }
    ]
  },
  {
    "category": "Meat & Seafood",
    "items": [
      { "name": "Chicken Breast", "amount": "1.5 kg", "checked": false }
    ]
  }
]
Standard categories should include: Produce, Meat & Seafood, Dairy & Eggs, Pantry Staples, Spices, Bakery.
Do not return any markdown formatting outside of the JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Grocery List Error:", error);
    throw new Error("Failed to generate grocery list.");
  }
};

const generateZeroWasteRecipeWithGemini = async (ingredients, profile) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });

  const restrictions = profile?.dietary_restrictions?.length ? profile.dietary_restrictions.join(", ") : "None";
  const allergies = profile?.food_allergies?.length ? profile.food_allergies.join(", ") : "None";
  const dietMode = profile?.diet_mode || "Balanced";

  const prompt = `You are a world-class Indian nutritionist and master chef.
I have a list of ingredients that are expiring soon or in low stock in my pantry.
Please generate exactly ONE healthy, delicious, and easy-to-cook recipe that PRIMARILY utilizes these ingredients.
You may assume basic kitchen staples like oil, water, salt, black pepper, turmeric, and basic spices are available.

Expiring ingredients: ${ingredients.join(", ")}

The user's profile:
- Diet Mode: ${dietMode}
- Dietary Restrictions: ${restrictions}
- Allergies: ${allergies}

The recipe MUST strictly adhere to the Diet Mode, dietary restrictions, and allergies. Do not suggest anything that violates these.
Return ONLY a valid JSON object matching this exact schema:
{
  "name": "Recipe Name",
  "description": "Short description of the recipe",
  "prepTime": "25 mins",
  "calories": 450,
  "protein": 32,
  "carbs": 24,
  "fat": 15,
  "ingredients": ["Ingredient Name - quantity/amount"],
  "instructions": ["Step 1...", "Step 2..."]
}
Do not return any markdown formatting or any other text outside the JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Zero Waste Recipe Error:", error);
    throw new Error("Failed to generate zero waste recipe.");
  }
};

const parseVoiceMealWithGemini = async (transcript, profile) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });

  const restrictions = profile?.dietary_restrictions?.length ? profile.dietary_restrictions.join(", ") : "None";
  const allergies = profile?.food_allergies?.length ? profile.food_allergies.join(", ") : "None";
  const dietMode = profile?.diet_mode || "Balanced";

  const prompt = `You are a professional nutritionist and calorie estimation assistant.
The user logged their meal by voice: "${transcript}"

Your task is to analyze this transcript, extract the foods/ingredients, estimate quantities, and calculate macros.
Assume the meal contains healthy, realistic proportions. Output estimated portion weights in grams.

The user's profile:
- Diet Mode: ${dietMode}
- Dietary Restrictions: ${restrictions}
- Allergies: ${allergies}

All food recommendations MUST respect these profile conditions.
Return ONLY a valid JSON object matching this exact schema:
{
  "mealType": "Lunch",
  "mealCategory": "Custom",
  "weight": 350,
  "volume": 0,
  "volumeSource": "voice",
  "imageUrl": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80",
  "foods": [
    { "name": "Scrambled Eggs", "confidence": 0.98 }
  ],
  "macros": {
    "calories": 420,
    "protein": 24,
    "carbs": 12,
    "fat": 18,
    "fiber": 2
  },
  "ingredients_macros": {
    "scrambled eggs": {
      "calories": 140,
      "protein": 12,
      "carbs": 2,
      "fat": 10,
      "fiber": 0,
      "portionWeight": 100,
      "portionCalories": 140,
      "portionProtein": 12,
      "portionCarbs": 2,
      "portionFat": 10,
      "portionFiber": 0
    }
  }
}
Note: the keys inside the "ingredients_macros" object MUST be the exact lowercase names of the items mapped in "foods".
Do not return any markdown formatting outside of the JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Voice Meal Parsing Error:", error);
    throw new Error("Failed to parse voice log with Gemini.");
  }
};

const generateChatResponse = async (message, history = [], context = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });

  const contextString = `
User Profile:
- Name: ${context.profile?.name || "Alex"}
- Age: ${context.profile?.age || "N/A"}
- Gender: ${context.profile?.gender || "N/A"}
- Height: ${context.profile?.height_cm || "N/A"} cm
- Weight: ${context.profile?.weight_kg || "N/A"} kg
- Activity Level: ${context.profile?.activity_level || "N/A"}
- Diet Mode: ${context.profile?.diet_mode || "Balanced"}
- Dietary Restrictions: ${context.profile?.dietary_restrictions?.join(", ") || "None"}
- Allergies: ${context.profile?.food_allergies?.join(", ") || "None"}

Current Pantry Ingredients:
${context.pantryIngredients?.join(", ") || "None"}

Today's Logged Meals:
${context.todayMeals?.map(m => `- ${m.foods?.map(f => f.name).join(", ") || "Meal"} (${m.calories || 0} kcal, P: ${m.protein || 0}g, C: ${m.carbs || 0}g, F: ${m.fat || 0}g)`).join("\n") || "No meals logged today yet."}

Nutritional Status Today:
- Calories Logged: ${context.caloriesLogged || 0} kcal
- Protein Logged: ${context.proteinLogged || 0} g
- Carbs Logged: ${context.carbsLogged || 0} g
- Fat Logged: ${context.fatLogged || 0} g

Active Workout Plan:
${context.profile?.workout_plan ? JSON.stringify(context.profile.workout_plan, null, 2) : "No workouts generated yet."}
`;

  const systemInstruction = `You are "NutriBot", a friendly, empathetic, and knowledgeable AI Nutritionist and health companion.
Your job is to support the user in achieving their health goals, answering their questions, and offering highly personalized tips.
You have access to the user's live health dashboard metrics, current pantry stocks, today's logged meals, and active workouts.

Here is the current live context of the application:
${contextString}

When answering the user, use this context to customize your replies. For example:
- If they ask what to cook, look at what they have in their Pantry.
- If they ask if they are eating enough protein or calories, check their targets vs today's logged meals.
- If they ask for workout tips, align it with their active workout plan.
- Keep your tone warm, highly professional, encouraging, and clear.
- Keep responses relatively brief (around 2-4 sentences or a short bulleted list where appropriate) so they look great in a small floating chat window.
- Make sure to respect all their allergies (NEVER suggest ingredients they are allergic to) and dietary mode (e.g. Vegetarian, Keto, etc.).
- Never mention "I have been given this context" or "According to the context string". Speak naturally, as if you are a real nutritionist accessing their live dashboard.`;

  const contents = [];
  
  if (history && history.length > 0) {
    history.forEach(msg => {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      });
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: message }]
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Chat Response Error:", error);
    throw new Error("Failed to generate chat response from Gemini.");
  }
};

const analyzeReceiptWithGemini = async (imagePath, mimeType) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  const prompt = `You are a professional scanner AI. Analyze this grocery shopping receipt image.
Identify all the food ingredients and grocery items purchased.
For each item, return its clean, simple name in English (e.g. "spinach", "milk", "chicken breast", "eggs", "greek yogurt").
Do not return quantities, brands, serial numbers, weights, or prices. Only return the simple, generic names of food ingredients.
Please output ONLY a valid JSON array of strings:
["item1", "item2", ...]
Do not wrap it in any markdown blocks or return any additional text.`;

  try {
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

    const parsed = JSON.parse(response.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gemini Receipt Analysis Error:", error);
    throw new Error("Failed to analyze receipt image with Gemini.");
  }
};

module.exports = { 
  analyzeFoodImageWithGemini, 
  getMealSuggestions, 
  generatePersonalizedDietPlan, 
  analyzePantryWithGemini, 
  generateGroceryList,
  generateZeroWasteRecipeWithGemini,
  parseVoiceMealWithGemini,
  generateChatResponse,
  analyzeReceiptWithGemini
};
