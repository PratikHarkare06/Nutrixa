/**
 * Food Density Lookup Table (g/cm³)
 * Volume = Weight (g) / Density (g/cm³)
 *
 * Sources: USDA, food science literature, standard culinary references.
 */

const FOOD_DENSITIES = {
  // ── Proteins ─────────────────────────────────────────────────────────────
  "chicken":              1.04,
  "chicken breast":       1.04,
  "grilled chicken":      1.04,
  "chicken breast grilled": 1.04,
  "roast chicken":        1.02,
  "chicken thigh":        1.02,
  "beef":                 1.05,
  "steak":                1.05,
  "ground beef":          1.03,
  "pork":                 1.04,
  "bacon":                0.95,
  "fish":                 1.05,
  "salmon":               1.04,
  "tuna":                 1.05,
  "shrimp":               1.06,
  "egg":                  1.03,
  "boiled egg":           1.03,
  "fried egg":            0.98,
  "scrambled egg":        0.95,
  "tofu":                 1.06,
  "paneer":               1.08,

  // ── Grains & Starches ────────────────────────────────────────────────────
  "rice":                 0.85,
  "white rice":           0.85,
  "brown rice":           0.80,
  "cooked rice":          0.85,
  "fried rice":           0.90,
  "pasta":                0.80,
  "cooked pasta":         0.80,
  "spaghetti":            0.80,
  "noodles":              0.80,
  "bread":                0.30,
  "white bread":          0.30,
  "whole wheat bread":    0.35,
  "pizza crust":          0.45,
  "pizza dough":          0.45,
  "oats":                 0.40,
  "oatmeal":              0.55,
  "quinoa":               0.75,
  "potato":               1.05,
  "boiled potato":        1.02,
  "mashed potato":        0.90,
  "french fries":         0.55,
  "sweet potato":         1.04,
  "corn":                 0.72,

  // ── Vegetables ───────────────────────────────────────────────────────────
  "broccoli":             0.37,
  "steamed broccoli":     0.40,
  "spinach":              0.22,
  "lettuce":              0.18,
  "tomato":               0.95,
  "tomatoes":             0.95,
  "cherry tomato":        0.97,
  "cucumber":             0.96,
  "carrot":               0.64,
  "carrots":              0.64,
  "onion":                0.72,
  "bell pepper":          0.55,
  "red bell pepper":      0.55,
  "green bell pepper":    0.55,
  "capsicum":             0.55,
  "mushroom":             0.55,
  "mushrooms":            0.55,
  "zucchini":             0.58,
  "eggplant":             0.48,
  "peas":                 0.80,
  "green peas":           0.80,
  "corn kernels":         0.72,
  "celery":               0.55,
  "cauliflower":          0.38,
  "kale":                 0.20,
  "cabbage":              0.35,
  "asparagus":            0.30,

  // ── Dairy ────────────────────────────────────────────────────────────────
  "cheese":               1.10,
  "mozzarella":           1.02,
  "mozzarella cheese":    1.02,
  "cheddar":              1.10,
  "parmesan":             1.20,
  "cream cheese":         0.98,
  "milk":                 1.03,
  "butter":               0.91,
  "yogurt":               1.05,
  "greek yogurt":         1.07,
  "sour cream":           1.00,
  "cream":                1.00,
  "heavy cream":          1.01,
  "raita":                1.04,

  // ── Legumes ──────────────────────────────────────────────────────────────
  "lentils":              0.82,
  "chickpeas":            0.80,
  "black beans":          0.85,
  "kidney beans":         0.85,
  "dal":                  0.85,
  "hummus":               0.90,

  // ── Fruits ───────────────────────────────────────────────────────────────
  "apple":                0.82,
  "banana":               0.95,
  "orange":               0.88,
  "mango":                1.00,
  "berries":              0.60,
  "strawberry":           0.60,
  "blueberry":            0.62,
  "avocado":              0.97,
  "lemon":                1.00,
  "pineapple":            0.95,
  "grapes":               0.75,

  // ── Sauces & Liquids ─────────────────────────────────────────────────────
  "tomato sauce":         1.05,
  "pasta sauce":          1.05,
  "soy sauce":            1.20,
  "olive oil":            0.91,
  "oil":                  0.92,
  "mayonnaise":           0.91,
  "ketchup":              1.10,
  "mustard":              1.05,
  "ranch dressing":       0.95,
  "salad dressing":       0.95,
  "gravy":                1.05,
  "curry":                1.05,
  "curry sauce":          1.05,

  // ── Nuts & Seeds ─────────────────────────────────────────────────────────
  "almonds":              0.61,
  "peanuts":              0.64,
  "walnuts":              0.65,
  "cashews":              0.62,
  "sesame seeds":         0.56,
  "sunflower seeds":      0.58,
  "chia seeds":           0.72,
  "peanut butter":        1.10,

  // ── Herbs & Spices (very low density) ───────────────────────────────────
  "basil":                0.15,
  "fresh basil":          0.15,
  "cilantro":             0.15,
  "parsley":              0.15,
  "mint":                 0.14,
  "oregano":              0.30,
  "cumin":                0.45,
  "turmeric":             0.50,
  "green chili":          0.55,
  "chili":                0.55,

  // ── Baked / Processed ────────────────────────────────────────────────────
  "cake":                 0.50,
  "cookie":               0.55,
  "donut":                0.45,
  "pizza":                0.60,
  "sandwich":             0.55,
  "burger":               0.75,
  "wrap":                 0.60,
  "nachos":               0.35,
  "chips":                0.25,
  "popcorn":              0.10,
};

// ── Category fallback densities (g/cm³) ────────────────────────────────────
const CATEGORY_DENSITIES = {
  meat:      1.04,
  fish:      1.05,
  grain:     0.80,
  vegetable: 0.50,
  fruit:     0.85,
  dairy:     1.05,
  legume:    0.82,
  sauce:     1.05,
  oil:       0.92,
  herb:      0.20,
  nut:       0.62,
  baked:     0.45,
  default:   0.80, // general food fallback
};

/**
 * Returns the density (g/cm³) for a given food name.
 * Falls back to category heuristic, then to 0.80 (default mixed food).
 *
 * @param {string} foodName
 * @returns {number} density in g/cm³
 */
const getFoodDensity = (foodName) => {
  const key = foodName.toLowerCase().trim();

  // 1. Exact match
  if (FOOD_DENSITIES[key] !== undefined) return FOOD_DENSITIES[key];

  // 2. Partial match — find the longest matching key within the name
  let bestMatch = null;
  let bestLen = 0;
  for (const [k, v] of Object.entries(FOOD_DENSITIES)) {
    if (key.includes(k) && k.length > bestLen) {
      bestMatch = v;
      bestLen = k.length;
    }
  }
  if (bestMatch !== null) return bestMatch;

  // 3. Category heuristic from keyword detection
  if (/chicken|beef|pork|lamb|turkey|meat|steak|sausage|bacon/.test(key)) return CATEGORY_DENSITIES.meat;
  if (/fish|salmon|tuna|shrimp|prawn|seafood|cod|tilapia/.test(key)) return CATEGORY_DENSITIES.fish;
  if (/rice|pasta|noodle|bread|wheat|grain|oat|quinoa|barley|corn|tortilla/.test(key)) return CATEGORY_DENSITIES.grain;
  if (/vegetable|veggie|salad|leaf|green|spinach|broccoli|carrot|onion|pepper|tomato/.test(key)) return CATEGORY_DENSITIES.vegetable;
  if (/fruit|apple|banana|berry|orange|mango|grape|melon/.test(key)) return CATEGORY_DENSITIES.fruit;
  if (/cheese|milk|cream|butter|yogurt|dairy|curd/.test(key)) return CATEGORY_DENSITIES.dairy;
  if (/bean|lentil|legume|chickpea|dal|hummus/.test(key)) return CATEGORY_DENSITIES.legume;
  if (/sauce|gravy|dressing|ketchup|mayo|dip|chutney/.test(key)) return CATEGORY_DENSITIES.sauce;
  if (/oil|fat/.test(key)) return CATEGORY_DENSITIES.oil;
  if (/herb|spice|basil|cilantro|parsley|mint|cumin|turmeric/.test(key)) return CATEGORY_DENSITIES.herb;
  if (/nut|almond|cashew|walnut|peanut|pistachio|seed/.test(key)) return CATEGORY_DENSITIES.nut;
  if (/cake|cookie|biscuit|bread|donut|pastry|muffin/.test(key)) return CATEGORY_DENSITIES.baked;

  // 4. Default
  return CATEGORY_DENSITIES.default;
};

module.exports = { getFoodDensity };
