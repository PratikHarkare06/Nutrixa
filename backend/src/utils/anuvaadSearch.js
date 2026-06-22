const fs = require('fs');
const path = require('path');

let anuvaadData = [];

// Load the database into memory
try {
  const dbPath = path.join(__dirname, '..', '..', 'anuvaad_db.json');
  if (fs.existsSync(dbPath)) {
    anuvaadData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    console.log(`[Anuvaad] Loaded ${anuvaadData.length} Indian food records`);
  } else {
    console.warn(`[Anuvaad] Database not found at ${dbPath}`);
  }
} catch (error) {
  console.error('[Anuvaad] Failed to load database:', error);
}

/**
 * Search the Anuvaad Indian Nutrient Database for a food item.
 * Uses a basic word-overlap scoring algorithm to find the best match.
 */
const searchAnuvaadDb = (query) => {
  if (!anuvaadData || anuvaadData.length === 0) return null;

  const cleanQuery = query.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const queryWords = cleanQuery.split(/\s+/).filter(w => w.length >= 2);
  if (queryWords.length === 0) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const item of anuvaadData) {
    const rawName = item.food_name.toLowerCase();
    const itemName = rawName.replace(/\s*\([^)]*\)/g, '').replace(/[^a-z0-9 ]/g, '').trim();
    
    // Exact match is an instant win
    if (itemName === cleanQuery || rawName === cleanQuery) {
      bestMatch = item;
      bestScore = 1.0;
      break;
    }

    // For single-word queries, only allow exact match to prevent incorrect mapping
    if (queryWords.length < 2) {
      continue;
    }

    const itemWords = itemName.split(/\s+/).filter(w => w.length >= 2);
    if (itemWords.length === 0) continue;

    // Check how many query words are present as full words in the item
    let matches = 0;
    for (const qWord of queryWords) {
      if (itemWords.includes(qWord)) {
        matches += 1;
      }
    }

    if (matches === 0) continue;

    // Calculate Jaccard similarity (Intersection over Union of words)
    const union = new Set([...queryWords, ...itemWords]).size;
    const jaccard = matches / union;

    // Penalize matches where the item has critical words that the query doesn't
    const modifiers = ["soup", "stew", "nog", "juice", "curry", "gravy", "powder", "sauce", "chutney", "pickle", "sandwich", "roll", "burger", "salad", "pizza"];
    let modifierPenalty = 1.0;
    for (const mod of modifiers) {
      if (itemWords.includes(mod) && !queryWords.includes(mod)) {
        modifierPenalty = 0.15;
      }
    }

    const score = jaccard * modifierPenalty;

    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && bestScore >= 0.5) {
    // Map it to standard output format expected by validateNutrition
    return {
      name: bestMatch.food_name,
      source: 'anuvaad',
      calories: Math.round(bestMatch.energy_kcal || 0),
      protein: Math.round(bestMatch.protein_g || 0),
      carbs: Math.round(bestMatch.carb_g || 0),
      fat: Math.round(bestMatch.fat_g || 0),
      fiber: Math.round(bestMatch.fibre_g || 0)
    };
  }

  return null;
};

/**
 * Gets the detailed item by its exact name (used after search)
 */
const getAnuvaadItem = (foodName) => {
  const item = anuvaadData.find(i => i.food_name === foodName);
  if (!item) return null;

  return {
    food_name: item.food_name,
    servings: {
      serving: [
        {
          serving_description: "100 g",
          metric_serving_amount: "100.000",
          metric_serving_unit: "g",
          calories: String(item.energy_kcal),
          carbohydrate: String(item.carb_g),
          protein: String(item.protein_g),
          fat: String(item.fat_g),
          fiber: String(item.fibre_g)
        }
      ]
    }
  };
};

module.exports = { searchAnuvaadDb, getAnuvaadItem };
