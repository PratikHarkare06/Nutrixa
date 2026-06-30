const fs = require("fs");
const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");
const { runYoloInference } = require("../utils/yoloInference");
const { getFoodDensity } = require("../utils/foodDensity");
const { runMiDaS } = require("../utils/midasDepth");
const { getCachedNutrition, setCachedNutrition } = require("../utils/nutritionCache");
const { emitProgress } = require("../utils/progressTracker");
const { searchAnuvaadDb, searchAnuvaadDbCandidates } = require("../utils/anuvaadSearch");
const { UserProfile } = require("../models/UserProfile");
const { applyUserCorrections } = require("../utils/userMemory");

// ─── FatSecret OAuth2 Token ───────────────────────────────────────────────────

const getFatSecretToken = async () => {
  const clientId = (process.env.FATSECRET_CLIENT_ID || "").trim();
  const clientSecret = (process.env.FATSECRET_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) throw new Error("FATSECRET_CONFIG_ERROR: credentials missing.");

  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials&scope=basic",
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
};

// ─── FatSecret Lookup ─────────────────────────────────────────────────────────

const fetchFatSecretCandidates = async (accessToken, foodName) => {
  try {
    const search = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(foodName)}&format=json&max_results=5`,
      { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await search.json();
    if (searchData.error) return [];
    if (!searchData.foods?.food) return [];

    const arr = Array.isArray(searchData.foods.food) ? searchData.foods.food : [searchData.foods.food];
    return arr.map(item => ({
      food_id: item.food_id,
      name: item.food_name || foodName
    }));
  } catch {
    return [];
  }
};

const fetchFatSecretDetails = async (accessToken, foodId, foodName) => {
  try {
    const details = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=food.get.v2&food_id=${foodId}&format=json`,
      { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const det = await details.json();
    if (!det.food?.servings) return null;

    const servArr = Array.isArray(det.food.servings.serving)
      ? det.food.servings.serving
      : [det.food.servings.serving];

    const servWithMetric = servArr.filter((s) => parseFloat(s.metric_serving_amount || 0) > 0);
    const serv = servWithMetric.length
      ? servWithMetric.reduce((best, s) =>
          Math.abs(parseFloat(s.metric_serving_amount) - 100) <
          Math.abs(parseFloat(best.metric_serving_amount) - 100)
            ? s : best
        )
      : servArr[0];

    const servingAmount = parseFloat(serv.metric_serving_amount || 100) || 100;
    const scale = Math.min(100 / servingAmount, 10);

    return {
      name: det.food.food_name || foodName, source: "fatsecret",
      calories: Math.round(parseFloat(serv.calories || 0) * scale),
      protein:  Math.round(parseFloat(serv.protein || 0) * scale),
      carbs:    Math.round(parseFloat(serv.carbohydrate || 0) * scale),
      fat:      Math.round(parseFloat(serv.fat || 0) * scale),
      fiber:    Math.round(parseFloat(serv.fiber || 0) * scale),
    };
  } catch {
    return null;
  }
};

// ─── USDA Lookup ──────────────────────────────────────────────────────────────

const fetchUSDACandidates = async (foodName) => {
  const key = (process.env.USDA_API_KEY || "").trim();
  if (!key) return [];
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&api_key=${key}&pageSize=5&dataType=Foundation,SR%20Legacy`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.foods?.length) return [];
    
    return data.foods.map(food => {
      const g = (id) => { const n = food.foodNutrients?.find((n) => n.nutrientId === id); return n ? Math.round(n.value) : 0; };
      return {
        name: food.description,
        source: "usda",
        calories: g(1008),
        protein: g(1003),
        carbs: g(1005),
        fat: g(1004),
        fiber: g(1079)
      };
    });
  } catch {
    return [];
  }
};

const resolveSemanticMatch = async (ingredient, cookingMethod, candidates) => {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return candidates[0];

  const ai = new GoogleGenAI({ apiKey });
  const candidatesList = candidates.map((c, idx) => `${idx}: "${c.name || c.description || c.food_name}"`).join("\n");

  const prompt = `You are a food database router. We need to match a user's food item to the most semantically accurate entry in our nutritional database.
User item: "${ingredient}"
Cooking method: "${cookingMethod || 'none'}"

Database options:
${candidatesList}

Select the single best option index from the database options. Bias your match heavily toward the cooking method: for example, if the cooking method is "raw", prefer "raw" or "uncooked" options; if "fried", prefer "fried" options; if "grilled", prefer "grilled" options.
Return ONLY the number index of the best match (e.g., "1"). Do not write any other text or markdown wrapping.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1
      }
    });
    const cleanedText = response.text.replace(/[^0-9]/g, "").trim();
    const index = parseInt(cleanedText, 10);
    if (!isNaN(index) && index >= 0 && index < candidates.length) {
      console.log(`  🧠 Semantic Routing selected candidate [${index}]: "${candidates[index].name || candidates[index].food_name}" for "${ingredient}" (method: ${cookingMethod})`);
      return candidates[index];
    }
  } catch (error) {
    console.warn("Semantic matching error:", error);
  }
  return candidates[0];
};

// ─── P3.9: Open Food Facts (3rd cascade) ─────────────────────────────────────

const fetchOpenFoodFacts = async (foodName) => {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&json=1&page_size=3&fields=product_name,nutriments`,
      { headers: { "User-Agent": "NutriVision/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const products = (data.products || []).filter((p) => p.nutriments?.["energy-kcal_100g"]);
    if (!products.length) return null;
    const p = products[0];
    const n = p.nutriments;
    return {
      name: p.product_name || foodName, source: "openfoodfacts",
      calories: Math.round(n["energy-kcal_100g"] || 0),
      protein: Math.round(n["proteins_100g"] || 0),
      carbs: Math.round(n["carbohydrates_100g"] || 0),
      fat: Math.round(n["fat_100g"] || 0),
      fiber: Math.round(n["fiber_100g"] || 0),
    };
  } catch { return null; }
};

// ─── Nutrition validation: reject physically impossible values ────────────────
// Max possible is pure fat = ~900 kcal/100g. Anything above = bad API data.

const MAX_KCAL_PER_100G = 900;

const validateNutrition = (data) => {
  if (!data) return null;
  if (data.calories > MAX_KCAL_PER_100G || data.calories < 0) {
    console.warn(`  ⚠ Rejected bad data for "${data.name}": ${data.calories} kcal/100g [${data.source}]`);
    return null;
  }
  return data;
};

// ─── Hardcoded fallbacks for common foods where APIs often return bad data ─────

const NUTRITION_FALLBACKS = {
  "pizza dough":          { calories: 270, protein: 8,  carbs: 53, fat: 3,  fiber: 2 },
  "bread dough":          { calories: 250, protein: 8,  carbs: 50, fat: 2,  fiber: 2 },
  "pasta dough":          { calories: 280, protein: 10, carbs: 55, fat: 2,  fiber: 2 },
  "flour":                { calories: 364, protein: 10, carbs: 76, fat: 1,  fiber: 3 },
  "pizza":                { calories: 266, protein: 11, carbs: 33, fat: 10, fiber: 2 },
  "white rice":           { calories: 130, protein: 3,  carbs: 28, fat: 0,  fiber: 0 },
  "brown rice":           { calories: 112, protein: 2,  carbs: 24, fat: 1,  fiber: 2 },
  "olive oil":            { calories: 884, protein: 0,  carbs: 0,  fat: 100, fiber: 0 },
  "butter":               { calories: 717, protein: 1,  carbs: 0,  fat: 81, fiber: 0 },
  "mozzarella cheese":    { calories: 280, protein: 28, carbs: 2,  fat: 17, fiber: 0 },
  "cheddar cheese":       { calories: 402, protein: 25, carbs: 1,  fat: 33, fiber: 0 },
  "mixed meal":           { calories: 150, protein: 8,  carbs: 18, fat: 5,  fiber: 2 },
  "sambar":               { calories: 97,  protein: 4,  carbs: 15, fat: 2,  fiber: 3 },
  "lentil stew":          { calories: 97,  protein: 4,  carbs: 15, fat: 2,  fiber: 3 },
  "chutney":              { calories: 266, protein: 4,  carbs: 10, fat: 22, fiber: 4 },
};

const getHardcodedFallback = (foodName) => {
  const key = foodName.toLowerCase().trim();
  // Exact match
  if (NUTRITION_FALLBACKS[key]) return { ...NUTRITION_FALLBACKS[key], name: foodName, source: "hardcoded" };
  // Partial match
  for (const [k, v] of Object.entries(NUTRITION_FALLBACKS)) {
    if (key.includes(k) || k.includes(key)) return { ...v, name: foodName, source: "hardcoded" };
  }
  return null;
};

// ─── P2.4: Cached unified lookup with validation ──────────────────────────────

const getNutritionalData = async (fatSecretToken, foodName, cookingMethod = "none") => {
  const cached = getCachedNutrition(foodName);
  if (cached) { console.log(`  ⚡ Cache hit: "${foodName}"`); return cached; }

  let result = null;

  // 1. Try Indian database first using semantic candidate routing
  const anuvaadCandidates = searchAnuvaadDbCandidates(foodName);
  if (anuvaadCandidates && anuvaadCandidates.length > 0) {
    const semMatch = await resolveSemanticMatch(foodName, cookingMethod, anuvaadCandidates);
    if (semMatch) {
      result = validateNutrition(semMatch);
      if (result) console.log(`  🇮🇳 Anuvaad match (semantic): "${foodName}" (method: ${cookingMethod}) → "${result.name}"`);
    }
  }

  // 2. Local Fallbacks
  if (!result) result = getHardcodedFallback(foodName);

  // 3. Global external APIs
  if (!result && fatSecretToken) {
    const searchCandidates = await fetchFatSecretCandidates(fatSecretToken, foodName);
    if (searchCandidates && searchCandidates.length > 0) {
      const semMatch = await resolveSemanticMatch(foodName, cookingMethod, searchCandidates);
      if (semMatch) {
        result = validateNutrition(await fetchFatSecretDetails(fatSecretToken, semMatch.food_id, foodName));
      }
    }
  }

  if (!result) {
    const usdaCandidates = await fetchUSDACandidates(foodName);
    if (usdaCandidates && usdaCandidates.length > 0) {
      const semMatch = await resolveSemanticMatch(foodName, cookingMethod, usdaCandidates);
      if (semMatch) result = validateNutrition(semMatch);
    }
  }

  if (!result) result = validateNutrition(await fetchOpenFoodFacts(foodName));

  if (result) {
    // Check discrepancy between Tier 1 (Anuvaad) and Tier 2/3 (FatSecret/USDA/Open Food Facts)
    // Run comparison asynchronously to avoid blocking the main thread
    if (anuvaadCandidates && anuvaadCandidates.length > 0) {
      const tier1 = anuvaadCandidates[0];
      const tier1Cal = tier1.calories;
      const otherCal = result.calories;
      const calDiff = Math.abs(tier1Cal - otherCal);
      const percentDiff = calDiff / Math.max(tier1Cal, 1);
      
      if (percentDiff > 0.25 && calDiff > 30) {
        console.warn(`[Nutrition Discrepancy] Ingredient: "${foodName}". Tier 1 (Anuvaad) energy: ${tier1Cal} kcal/100g vs Tier 2/3 (${result.source}) energy: ${otherCal} kcal/100g. Discrepancy: ${Math.round(percentDiff * 100)}%`);
      }
    }

    setCachedNutrition(foodName, result);
  }
  return result;
};

// ─── P3.8: Gemini — ingredients + meal classification in one call ─────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Shared vision prompt builder ─────────────────────────────────────────────

const buildVisionPrompt = (userMealType = "") => {
  const mealHint = userMealType
    ? `\nContext: The user says this is a ${userMealType}. Use this as a hint for portion sizes but do NOT let it limit ingredient detection — the image is the primary source of truth.`
    : "";

  return `You are a food recognition expert analyzing a food photograph.${mealHint}

Return ONLY a raw JSON object with this exact structure:
{
  "ingredients": ["ingredient1", "ingredient2", ...],
  "cookingMethods": {
    "ingredient1": "raw|grilled|fried|boiled|roasted|steamed|baked|none",
    "ingredient2": "..."
  },
  "mealType": "breakfast|lunch|dinner|snack|drink|dessert",
  "mealCategory": "short dish name (1-3 words, e.g. 'margherita pizza', 'chicken biryani')"
}

For ingredients — STRICT RULES:
1. STRICT ANTI-HALLUCINATION: List ONLY what is physically, visibly present in the photograph.
2. DO NOT infer accompanying side dishes. If the photo is of a dish that is typically served with sides (e.g. Biryani with Raita, Dosa with Chutney), DO NOT list the sides unless they are explicitly visible in the frame.
3. STRICTLY OBSERVE MEAT/VEG DISTINCTIONS: If a dish is traditionally vegetarian (e.g. plain Dosa, Idli, Paneer), DO NOT hallucinate or list meat (like chicken or beef) unless it is clearly visible.
4. DO NOT list micro-ingredients like spices, seeds (e.g. mustard seeds), herbs (e.g. curry leaves), or garnishes (e.g. chopped onions, green chilis). They have negligible calories and will confuse the nutritional database.
5. For a pizza: list the CRUST, SAUCE, and visible TOPPINGS — NOT flour, yeast, water.
6. For a curry/stew: list the MAIN visible components (e.g. the meat, the vegetables, and the sauce) — NOT the spices.
7. Use simple common English names (e.g. "mozzarella cheese", "tomato sauce").
8. Maximum 6 ingredients. Focus ONLY on the major caloric components.
9. Do NOT list cooking methods as ingredients.
10. RAW/UNCOOKED INGREDIENTS: If the image depicts raw, uncooked ingredients (such as raw chicken drumsticks, raw vegetables, or whole fruits), list them exactly as they are (e.g. "raw chicken drumsticks") rather than guessing cooked dishes (e.g. do not guess "chicken stew" for raw chicken).
11. COMPOSITE DISHES: For composite/multi-component meals (such as Pav Bhaji, Chole Bhature, Burger and Fries, Idli Sambar, Dosa Chutney, Steak and Mashed Potatoes), DO NOT list the combined dish name (e.g. "Pav Bhaji") as a single ingredient. Instead, list the main constituent components as separate ingredients (e.g. "pav bread", "bhaji curry", "butter"; or "bhature bread", "chole curry"; or "burger bun", "beef patty", "french fries"). This is critical so we can calculate the calories of each main part correctly.`;
};

const parseVisionResponse = (text) => {
  // Extract JSON even if there's surrounding text
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  const parsed = JSON.parse(match[0]);
  const ingredients = Array.isArray(parsed.ingredients)
    ? parsed.ingredients.map(String).filter(Boolean)
    : [];
  if (ingredients.length === 0) return null;
  return {
    succeeded: true,
    ingredients,
    cookingMethods: parsed.cookingMethods || {},
    mealType: parsed.mealType || "unknown",
    mealCategory: parsed.mealCategory || "meal",
  };
};

// ─── Nvidia API Vision (backup for Gemini rate limits) ─────────────────────────

const analyzeImageWithNvidia = async (imagePath, mimeType, userMealType = "") => {
  const apiKey = (process.env.NIM_API_KEY || process.env.NVIDIA_API || process.env.NVIDIA_API_KEY || "").trim();
  if (!apiKey) return null;

  try {
    const base64Image = fs.readFileSync(imagePath).toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    const model = process.env.NVIDIA_VISION_MODEL || "meta/llama-3.2-11b-vision-instruct";

    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a professional nutrition and culinary assistant. You MUST respond with ONLY a valid, parseable JSON object matching the requested schema. Do not include any conversational text, markdown block wrapping (such as ```json), or explanations outside of the raw JSON."
          },
          {
            role: "user",
            content: [
              { type: "text", text: buildVisionPrompt(userMealType) },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          }
        ],
        temperature: 0.1,
        top_p: 0.95,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[Nvidia] HTTP ${res.status} — skipping. Error: ${errorText}`);
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const result = parseVisionResponse(text);
    if (result) console.log(`[Nvidia] ✓ Vision succeeded (${model})`);
    return result;
  } catch (err) {
    console.error("[Nvidia] Error:", err?.message || err);
    return null;
  }
};

// ─── Gemini Vision (primary) ──────────────────────────────────────────────────

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-flash-latest",
  "gemini-flash-lite-latest"
];

const analyzeImageWithGemini = async (imagePath, mimeType, userMealType = "") => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const base64Image = fs.readFileSync(imagePath).toString("base64");
  const prompt = buildVisionPrompt(userMealType);

  // Try each model with up to 2 retries + quick backoff on 429 to avoid frontend 30s timeout
  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [prompt, { inlineData: { data: base64Image, mimeType } }],
          config: { 
            responseMimeType: "application/json",
            temperature: 0.0 
          },
        });

        const result = parseVisionResponse(response.text);
        if (!result) { console.warn(`[Gemini] Empty result on ${model}`); break; }
        if (model !== "gemini-2.5-flash") console.log(`[Gemini] Used model: ${model}`);
        return result;
      } catch (err) {
        const is429 = err?.status === 429 || String(err).includes("429");
        if (is429 && attempt < 2) {
          const wait = 500 * attempt; // 500ms, 1000ms
          console.warn(`[Gemini] 429 on ${model} (attempt ${attempt}) — retrying in ${wait}ms`);
          await sleep(wait);
        } else if (is429) {
          console.warn(`[Gemini] 429 exhausted on ${model} — trying next`);
          break;
        } else {
          console.error(`[Gemini] Error on ${model}:`, err?.message || err);
          break;
        }
      }
    }
  }
  return null; // all Gemini models failed
};

// ─── Combined vision analysis: Gemini → Groq → fail ──────────────────────────

const analyzeImageWithVision = async (imagePath, mimeType, userMealType = "") => {
  // 1. Try Gemini (primary)
  console.log("[Vision] Trying Gemini Vision as primary model");
  const geminiResult = await analyzeImageWithGemini(imagePath, mimeType, userMealType);
  if (geminiResult) return geminiResult;

  // 2. Try Nvidia API (backup)
  console.warn("[Vision] Gemini Vision failed or exhausted — trying Nvidia API Vision as backup");
  const nvidiaResult = await analyzeImageWithNvidia(imagePath, mimeType, userMealType);
  if (nvidiaResult) return nvidiaResult;

  // 3. Both failed
  console.error("[Vision] All vision models exhausted");
  return { succeeded: false, ingredients: [], mealType: "unknown", mealCategory: "meal" };
};



// ─── P2.6: Smart ingredient merge with substring deduplication ────────────────

// Dish-level words YOLO might detect — these are meal names, not ingredients
const DISH_LEVEL_WORDS = new Set([
  "pizza", "burger", "sandwich", "salad", "sushi", "pasta", "biryani",
  "curry", "soup", "stew", "food", "meal", "dish", "plate", "bowl",
  "breakfast", "lunch", "dinner", "snack", "dessert", "drink",
]);

const isDishLevelName = (name) => {
  const words = name.toLowerCase().trim().split(/\s+/);
  return words.length === 1 && DISH_LEVEL_WORDS.has(words[0]);
};

const smartMergeIngredients = (geminiList, yoloList) => {
  const candidates = [...geminiList];

  // Only add YOLO names that look like specific ingredients, not dish-level names
  for (const { name } of yoloList) {
    if (!name.startsWith("ingredient_") && !isDishLevelName(name)) {
      candidates.push(name);
    }
  }

  // Longer (more specific) names first so "grilled chicken breast" beats "chicken"
  candidates.sort((a, b) => b.length - a.length);

  const merged = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const cLow = candidate.toLowerCase().trim();
    if (!cLow || seen.has(cLow)) continue;

    const isRedundant = merged.some((existing) => {
      const eLow = existing.toLowerCase();
      return eLow.includes(cLow) || cLow.includes(eLow);
    });

    if (!isRedundant) {
      merged.push(candidate.trim());
      seen.add(cLow);
    }
  }

  return merged;
};

// ─── P1.3: Confidence scoring ─────────────────────────────────────────────────

/**
 * Computes a blended confidence score from:
 *  - YOLO detection confidence (if available)
 *  - Jaccard word-overlap between input name and resolved API name
 */
const calculateConfidence = (originalName, resolvedName, yoloConf = null) => {
  const origWords = new Set(originalName.toLowerCase().split(/\s+/));
  const resWords = new Set(resolvedName.toLowerCase().split(/\s+/));
  const intersection = [...origWords].filter((w) => resWords.has(w)).length;
  const union = new Set([...origWords, ...resWords]).size;
  const nameMatch = union > 0 ? intersection / union : 0;

  // We boost the base confidence so exact matches hit > 85% automatically
  const score = yoloConf !== null
    ? yoloConf * 0.4 + nameMatch * 0.4 + 0.2
    : nameMatch * 0.3 + 0.65; // Base 65% + 30% for exact name match = 95%

  return parseFloat(Math.min(0.99, score).toFixed(2));
};

// ─── P1.2: Category-based typical portion weights ─────────────────────────────

/**
 * Returns the expected serving weight (grams) for a food item by category.
 * Tries both the resolved API name and the original ingredient name.
 */
const getTypicalPortionWeight = (foodName, originalName = "") => {
  // Try both names — originalName is often more accurately categorised
  const names = [foodName.toLowerCase(), originalName.toLowerCase()].filter(Boolean);

  for (const k of names) {
    if (/\b(herb|basil|cilantro|parsley|mint|oregano|thyme|rosemary)\b/.test(k)) return 4;
    if (/\b(spice|cumin|turmeric|cinnamon|cardamom|chili|pepper|paprika)\b/.test(k)) return 4;
    if (/\b(salt|sugar|honey)\b/.test(k)) return 5;
    if (/\b(oil|olive|butter|ghee)\b/.test(k)) return 15;
    if (/\b(onion|garlic|ginger|lemon|lime|scallion|jalapeno)\b/.test(k)) return 20; // garnish/aromatics
    if (/\b(chutney|dip|pickle)\b/.test(k)) return 40; // Full bowl of chutney
    if (/\b(sauce|gravy|dressing|ketchup|mayo|mustard|soy sauce|vinegar)\b/.test(k)) return 30;
    if (/\b(cream cheese|cream|yogurt|curd|raita|sour cream)\b/.test(k)) return 40;
    if (/\b(cheese)\b/.test(k)) return 40;
    if (/\b(bun|roll|pav|slider|biscuit|idli)\b/.test(k)) return 60; // small breads/idli
    if (/\b(egg)\b/.test(k)) return 60;
    if (/\b(nut|almond|cashew|walnut|peanut|seed)\b/.test(k)) return 20;
    if (/\b(soup|broth|dal|stew|curry)\b/.test(k)) return 200;
    if (/\b(chicken|beef|fish|pork|lamb|meat|steak|salmon|tuna|shrimp|prawn|tofu|paneer)\b/.test(k)) return 150;
    if (/\b(dosa|crepe|pancake|waffle)\b/.test(k)) return 120; // Full-sized dosa
    // Grains/doughs — pizza dough, bread dough, etc.
    if (/\b(rice|pasta|noodle|bread|roti|naan|tortilla|oats|quinoa|dough|pizza base|crust)\b/.test(k)) return 100;
    if (/\b(potato|sweet potato|mash)\b/.test(k)) return 100;
    if (/\b(fruit|apple|banana|orange|mango|berry|grape)\b/.test(k)) return 100;
    if (/\b(vegetable|veggie|broccoli|carrot|spinach|bell pepper|tomato|cucumber|mushroom|corn|peas|lettuce|capsicum)\b/.test(k)) return 80;
  }
  return 80; // default
};

// ─── Main Analysis ────────────────────────────────────────────────────────────

const analyzeFoodWithFatSecret = async (imagePath, mimeType, imageUrl, userMealType = "", uploadId = null) => {
  const notify = (stage, msg) => {
    if (uploadId) emitProgress(uploadId, stage, msg);
  };

  notify("vision", "AI is analyzing the image to detect ingredients...");
  
  // P1.1: Run YOLO first (fast local ONNX), then Gemini + MiDaS in parallel
  // using the REAL bbox ratio from YOLO — not a hardcoded 0.5
  const yoloData = await runYoloInference(imagePath);
  const bboxRatio = yoloData.ratio;
  const yoloIngredients = yoloData.detectedIngredients || [];
  const yoloBoxes = yoloData.boxes || [];

  const [geminiData, midasResult] = await Promise.all([
    analyzeImageWithVision(imagePath, mimeType, userMealType),
    runMiDaS(imagePath, bboxRatio, yoloBoxes),
  ]);

  // Prefer user-provided meal type; fall back to AI inference
  const mealType     = userMealType || geminiData.mealType;
  const mealCategory = geminiData.mealCategory;

  // If Gemini failed, don't use the "Mixed Meal" sentinel as an ingredient.
  // Use YOLO results only; if YOLO also has nothing, throw a retryable error.
  const geminiIngredients = geminiData.succeeded ? geminiData.ingredients : [];
  if (!geminiData.succeeded) {
    const yoloNames = yoloIngredients.filter(({ name }) => !isDishLevelName(name)).map(({ name }) => name);
    if (yoloNames.length === 0) {
      throw new Error("ANALYSIS_UNAVAILABLE: AI image analysis is temporarily rate-limited. Please try again in a moment.");
    }
    console.warn(`[NutriVision] Gemini failed — using ${yoloNames.length} YOLO-only ingredients`);
  }

  // P2.6: Smart merge with substring deduplication + User Memory Corrections
  const correctedGemini = applyUserCorrections(geminiIngredients);
  const correctedYolo = yoloIngredients.map(y => ({ ...y, name: applyUserCorrections([y.name])[0] }));
  const allIngredients = smartMergeIngredients(correctedGemini, correctedYolo);
  console.log(`[NutriVision] ${allIngredients.length} ingredients | ${mealCategory} (${mealType}${userMealType ? ' — user' : ' — AI'})`);
  console.log(`[NutriVision] Ingredients:`, allIngredients);

  // FatSecret token (non-fatal — USDA/OFF covers if null)
  let fatSecretToken = null;
  try {
    fatSecretToken = await getFatSecretToken();
    if (fatSecretToken) console.log("[NutriVision] FatSecret token ✓");
  } catch (_) {
    console.warn("[NutriVision] FatSecret auth failed — using USDA/OFF.");
  }

  // YOLO confidence map for scoring
  const yoloConfMap = {};
  for (const { name, confidence } of yoloIngredients) {
    yoloConfMap[name.toLowerCase()] = confidence;
  }

  // P2.4: Lookup nutrition with cache + 3-API cascade
  notify("nutrition", "Fetching USDA/FatSecret nutritional data...");
  const BATCH_SIZE = 6;
  const detectedFoods = [];
  const ingredientsMacros = {};
  const resolvedNames = new Set(); // dedup by API-returned name
  const cookingMethods = geminiData.cookingMethods || {};

  for (let i = 0; i < allIngredients.length; i += BATCH_SIZE) {
    const batch = allIngredients.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((ing) => {
      const method = cookingMethods[ing] || "none";
      return getNutritionalData(fatSecretToken, ing, method);
    }));

    for (let j = 0; j < batch.length; j++) {
      const nutriments = results[j];
      const originalName = batch[j];

      if (nutriments) {
        const key = nutriments.name.toLowerCase();
        if (resolvedNames.has(key)) {
          console.log(`  ⚠ Dup skipped: "${originalName}" → "${nutriments.name}"`);
          continue;
        }
        resolvedNames.add(key);

        // P1.3: Blended confidence score
        const yoloConf = yoloConfMap[originalName.toLowerCase()] ?? null;
        const confidence = calculateConfidence(originalName, nutriments.name, yoloConf);

        // Store originalName alongside resolved name for better weight categorisation
        detectedFoods.push({ name: nutriments.name, originalName, confidence });
        ingredientsMacros[key] = {
          calories: nutriments.calories, protein: nutriments.protein,
          fat: nutriments.fat, carbs: nutriments.carbs, fiber: nutriments.fiber,
          source: nutriments.source,
        };
        console.log(`  ✓ ${nutriments.name} [${nutriments.source}] ${nutriments.calories} kcal/100g | conf: ${confidence}`);
      } else {
        const fallbackKey = originalName.toLowerCase();
        if (resolvedNames.has(fallbackKey)) continue;
        resolvedNames.add(fallbackKey);

        const confidence = calculateConfidence(originalName, originalName, yoloConfMap[fallbackKey] ?? null);
        console.warn(`  ✗ No data: "${originalName}"`);
        detectedFoods.push({ name: originalName, originalName, confidence });
        ingredientsMacros[fallbackKey] = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, source: "unknown" };
      }
    }
  }

  if (detectedFoods.length === 0) {
    detectedFoods.push({ name: "Mixed Meal", confidence: 0.5 });
    ingredientsMacros["mixed meal"] = { calories: 250, protein: 10, fat: 10, carbs: 20, fiber: 2, source: "fallback" };
  }

  // P1.1: Volume/weight from MiDaS (calibrated) or YOLO fallback
  notify("calculating", "Estimating portion weights and finalising calculations...");
  let calculatedWeight, totalVolume;
  if (midasResult.success && midasResult.volume_cm3 > 0) {
    totalVolume = midasResult.volume_cm3;
    calculatedWeight = midasResult.weight_g;
    console.log(`[NutriVision] Volume: MiDaS → ${totalVolume} cm³, ${calculatedWeight} g`);
  } else {
    const maxEstimatedWeight = detectedFoods.length * 250;
    calculatedWeight = Math.max(50, bboxRatio * maxEstimatedWeight);
    totalVolume = 0;
    console.log(`[NutriVision] Volume: density fallback → ${calculatedWeight} g`);
  }

  // Apply per-user/per-device calibration offset feedback loop
  try {
    const profile = await UserProfile.findOne({ profile_key: "primary" }).lean();
    if (profile && typeof profile.calibration_offset === "number") {
      const offset = profile.calibration_offset;
      if (offset !== 1.0) {
        calculatedWeight *= offset;
        totalVolume *= offset;
        console.log(`[Calibration] Applied user offset ${offset} → weight: ${Math.round(calculatedWeight)}g`);
      }
    }
  } catch (calErr) {
    console.error("Failed to apply calibration offset:", calErr);
  }

  // Apply meal-type portion scale factor:
  //  snack = 0.5×, breakfast = 0.7×, lunch = 1.0×, dinner = 1.15×
  //  (dosa can be breakfast or dinner — scale adjusts, ingredients stay the same)
  const MEAL_SCALE = { snack: 0.5, breakfast: 0.7, lunch: 1.0, dinner: 1.15, drink: 0.4, dessert: 0.6 };
  const mealScale = MEAL_SCALE[mealType] ?? 1.0;
  if (mealScale !== 1.0) {
    calculatedWeight *= mealScale;
    totalVolume      *= mealScale;
    console.log(`[NutriVision] Meal scale (${mealType}): ×${mealScale} → ${Math.round(calculatedWeight)} g`);
  }

  // ── Sanity cap: total meal weight ─────────────────────────────────────────
  // MiDaS has no real-world reference → can over-estimate by 3-5×.
  // A realistic single-serving meal: 300g base + 100g per extra ingredient, max 1000g.
  const MEAL_WEIGHT_CAP = Math.min(300 + detectedFoods.length * 100, 1000);
  
  const referenceFound = midasResult.scale_info?.reference_object_found;
  if (!referenceFound && calculatedWeight > MEAL_WEIGHT_CAP) {
    console.warn(`[NutriVision] Weight capped: ${Math.round(calculatedWeight)}g → ${MEAL_WEIGHT_CAP}g`);
    totalVolume = totalVolume * (MEAL_WEIGHT_CAP / calculatedWeight);
    calculatedWeight = MEAL_WEIGHT_CAP;
  } else if (referenceFound) {
    console.log(`[NutriVision] 🪙 Coin detected! Real-world scale applied. Bypassing heuristic weight caps.`);
  }

  // P1.2: Distribute weight proportionally by typical category portion size
  const typicalWeights = detectedFoods.map((f) => getTypicalPortionWeight(f.name, f.originalName || ""));
  const typicalSum = typicalWeights.reduce((a, b) => a + b, 0);

  // Distribute proportionally, but apply different caps based on food type.
  // We want to allow main items (like 4 pavs) to scale up significantly,
  // but strictly cap garnishes (like butter, lemon) so they don't absorb the weight.
  const portionWeights = typicalWeights.map((tw, i) => {
    const raw = (tw / typicalSum) * calculatedWeight;
    const name = detectedFoods[i].name.toLowerCase();
    
    // Define if item is a garnish/condiment that should be strictly capped
    const isGarnish = /\b(herb|spice|salt|sugar|oil|butter|ghee|lemon|lime|onion|garlic|ginger|sauce|dressing|mayo)\b/.test(name);
    
    // Garnishes strictly capped at 1.5x typical. Main items can scale up to 15.0x typical.
    const maxMultiplier = isGarnish ? 1.5 : 15.0;
    const cap = tw * maxMultiplier; 
    
    return Math.min(raw, cap);
  });
  
  // After capping, recalculate actual total volume proportionally
  const actualTotalW = portionWeights.reduce((a, b) => a + b, 0);
  if (actualTotalW < calculatedWeight * 0.99) {
    calculatedWeight = actualTotalW; // sync to capped total
  }

  // Scale 100g macros → actual portion per ingredient
  const processedFoods = detectedFoods.map((food, idx) => {
    const key = food.name.toLowerCase();
    const m = ingredientsMacros[key] || { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
    const w = portionWeights[idx];

    const portionCalories = (m.calories / 100) * w;
    const portionProtein  = (m.protein  / 100) * w;
    const portionCarbs    = (m.carbs    / 100) * w;
    const portionFat      = (m.fat      / 100) * w;
    const portionFiber    = (m.fiber    / 100) * w;

    const density = getFoodDensity(food.name);
    const portionVolume = midasResult.success
      ? Math.round(totalVolume / detectedFoods.length)
      : w / density;

    if (!midasResult.success) totalVolume += portionVolume;

    ingredientsMacros[key] = {
      ...m,
      caloriesPerGram:  parseFloat((m.calories / 100).toFixed(2)),
      proteinPerGram:   parseFloat((m.protein  / 100).toFixed(2)),
      carbsPerGram:     parseFloat((m.carbs    / 100).toFixed(2)),
      fatPerGram:       parseFloat((m.fat      / 100).toFixed(2)),
      fiberPerGram:     parseFloat((m.fiber    / 100).toFixed(2)),
      density,
      portionWeight:    Math.round(w),
      portionVolume:    Math.round(portionVolume),
      portionCalories:  Math.round(portionCalories),
      portionProtein:   Math.round(portionProtein),
      portionCarbs:     Math.round(portionCarbs),
      portionFat:       Math.round(portionFat),
      portionFiber:     Math.round(portionFiber),
    };

    console.log(`  → ${food.name}: ${Math.round(w)}g | ${Math.round(portionCalories)} kcal | conf: ${food.confidence}`);

    return {
      ...food,
      calculatedCalories: portionCalories,
      calculatedProtein:  portionProtein,
      calculatedCarbs:    portionCarbs,
      calculatedFat:      portionFat,
      calculatedFiber:    portionFiber,
    };
  });

  const sum = (k) => processedFoods.reduce((acc, f) => acc + f[k], 0);

  const result = {
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
    mealType,
    mealCategory,
    createdAt: new Date().toISOString(),
  };

  notify("complete", "Analysis complete!");
  return result;
};

module.exports = { analyzeFoodWithFatSecret };
