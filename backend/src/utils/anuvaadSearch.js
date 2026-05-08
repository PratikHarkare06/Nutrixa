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

  const queryWords = query.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
  if (queryWords.length === 0) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const item of anuvaadData) {
    // Strip Hindi translations in parentheses for fair length comparisons
    const rawName = item.food_name.toLowerCase();
    const itemName = rawName.replace(/\s*\([^)]*\)/g, '').trim();
    
    // Exact match is an instant win
    if (itemName === query.toLowerCase() || rawName === query.toLowerCase()) {
      bestMatch = item;
      bestScore = 100;
      break;
    }

    // Otherwise calculate word overlap
    let matches = 0;
    for (const word of queryWords) {
      if (itemName.includes(word)) {
        matches += 1;
      }
    }

    // Score based on percentage of query words matched
    const score = matches / queryWords.length;
    
    // Penalize if the target name is extremely long compared to the query
    const lengthPenalty = Math.max(1, itemName.length / (query.length + 5));
    const finalScore = score / lengthPenalty;

    if (finalScore > bestScore && finalScore > 0.6) {
      bestScore = finalScore;
      bestMatch = item;
    }
  }

  if (bestMatch && bestScore > 0.6) {
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
