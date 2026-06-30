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

const cleanString = (str) => {
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\bparantha\b/g, 'paratha')
    .replace(/\bbiriyani\b/g, 'biryani')
    .replace(/\bchappati\b/g, 'chapati')
    .replace(/\bchapatti\b/g, 'chapati')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Search the Anuvaad Indian Nutrient Database for a food item.
 * Uses a basic word-overlap scoring algorithm to find the best match.
 */
const searchAnuvaadDb = (query) => {
  if (!anuvaadData || anuvaadData.length === 0) return null;

  const cleanQuery = cleanString(query);
  const queryWords = cleanQuery.split(' ').filter(w => w.length >= 2);
  if (queryWords.length === 0) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const item of anuvaadData) {
    const rawName = item.food_name.toLowerCase();
    const itemName = cleanString(rawName);
    
    // Exact match is an instant win
    if (itemName === cleanQuery || cleanString(item.food_name) === cleanQuery) {
      bestMatch = item;
      bestScore = 1.0;
      break;
    }

    // For single-word queries, only allow exact match to prevent incorrect mapping
    if (queryWords.length < 2) {
      continue;
    }

    // Get unique words in item to avoid duplicate word inflation
    const itemWords = Array.from(new Set(itemName.split(' ').filter(w => w.length >= 2)));
    if (itemWords.length === 0) continue;

    // Check how many query words are present as full words in the item
    let matches = 0;
    for (const qWord of queryWords) {
      if (itemWords.includes(qWord)) {
        matches += 1;
      }
    }

    if (matches === 0) continue;

    const queryMatchRatio = matches / queryWords.length;
    
    // Soft penalty for unmatched extra words in the item name
    const extraWords = Math.max(0, itemWords.length - matches);
    const itemPenalty = 1 / (1 + 0.12 * extraWords);

    // Penalize matches where the item has critical words that the query doesn't
    const modifiers = [
      "soup", "stew", "nog", "juice", "curry", "gravy", "powder", "sauce", "chutney", "pickle", "sandwich", "roll", "burger", "salad", "pizza",
      "dosa", "idli", "roti", "naan", "paratha", "rice", "biryani", "samosa", "khichdi", "upma", "poha", "dhokla", "vada", "pav"
    ];
    let modifierPenalty = 1.0;
    for (const mod of modifiers) {
      if (itemWords.includes(mod) && !queryWords.includes(mod)) {
        modifierPenalty = 0.15;
      }
    }

    const score = queryMatchRatio * itemPenalty * modifierPenalty;

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

const searchAnuvaadDbCandidates = (query) => {
  if (!anuvaadData || anuvaadData.length === 0) return [];

  const cleanQuery = cleanString(query);
  const queryWords = cleanQuery.split(' ').filter(w => w.length >= 2);
  if (queryWords.length === 0) return [];

  const candidates = [];

  for (const item of anuvaadData) {
    const rawName = item.food_name.toLowerCase();
    const itemName = cleanString(rawName);
    
    if (itemName === cleanQuery || cleanString(item.food_name) === cleanQuery) {
      candidates.push({ ...item, score: 1.0 });
      continue;
    }

    if (queryWords.length < 2) {
      continue;
    }

    const itemWords = Array.from(new Set(itemName.split(' ').filter(w => w.length >= 2)));
    if (itemWords.length === 0) continue;

    let matches = 0;
    for (const qWord of queryWords) {
      if (itemWords.includes(qWord)) {
        matches += 1;
      }
    }

    if (matches === 0) continue;

    const queryMatchRatio = matches / queryWords.length;
    const extraWords = Math.max(0, itemWords.length - matches);
    const itemPenalty = 1 / (1 + 0.12 * extraWords);

    const modifiers = [
      "soup", "stew", "nog", "juice", "curry", "gravy", "powder", "sauce", "chutney", "pickle", "sandwich", "roll", "burger", "salad", "pizza",
      "dosa", "idli", "roti", "naan", "paratha", "rice", "biryani", "samosa", "khichdi", "upma", "poha", "dhokla", "vada", "pav"
    ];
    let modifierPenalty = 1.0;
    for (const mod of modifiers) {
      if (itemWords.includes(mod) && !queryWords.includes(mod)) {
        modifierPenalty = 0.15;
      }
    }

    const score = queryMatchRatio * itemPenalty * modifierPenalty;
    if (score >= 0.3) {
      candidates.push({ ...item, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, 5).map(c => ({
    name: c.food_name,
    source: 'anuvaad',
    calories: Math.round(c.energy_kcal || 0),
    protein: Math.round(c.protein_g || 0),
    carbs: Math.round(c.carb_g || 0),
    fat: Math.round(c.fat_g || 0),
    fiber: Math.round(c.fibre_g || 0)
  }));
};

const searchAnuvaadAutocomplete = (query) => {
  if (!anuvaadData || anuvaadData.length === 0) return [];
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  return anuvaadData
    .filter(item => item.food_name.toLowerCase().includes(cleanQ))
    .slice(0, 10)
    .map(item => ({
      name: item.food_name,
      calories: Math.round(item.energy_kcal || 0),
      protein: Math.round(item.protein_g || 0),
      carbs: Math.round(item.carb_g || 0),
      fat: Math.round(item.fat_g || 0),
      fiber: Math.round(item.fibre_g || 0)
    }));
};

module.exports = { searchAnuvaadDb, searchAnuvaadDbCandidates, getAnuvaadItem, searchAnuvaadAutocomplete };
