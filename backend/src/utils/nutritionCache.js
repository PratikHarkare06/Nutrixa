/**
 * nutritionCache.js
 * ─────────────────────────────────────────────────────────────────────────────
 * P2.4 – In-memory nutrition cache with 24-hour TTL.
 *
 * Prevents redundant FatSecret / USDA / OFF API calls for the same ingredient
 * within a server session. TTL resets on each access (sliding window).
 */

const CACHE = new Map();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Retrieve a cached nutrition result.
 * @param {string} foodName
 * @returns {object|null} cached data or null if missing/expired
 */
const getCachedNutrition = (foodName) => {
  const key = foodName.toLowerCase().trim();
  const entry = CACHE.get(key);
  if (!entry) return null;

  if (Date.now() - entry.ts > TTL_MS) {
    CACHE.delete(key);
    return null;
  }

  // Evict stale entries with impossible calorie values
  if (entry.data && (entry.data.calories > 900 || entry.data.calories < 0)) {
    CACHE.delete(key);
    return null;
  }

  entry.hits = (entry.hits || 0) + 1;
  return entry.data;
};

/**
 * Store a nutrition result in cache.
 * @param {string} foodName
 * @param {object} data  The nutrition object to cache.
 */
const setCachedNutrition = (foodName, data) => {
  CACHE.set(foodName.toLowerCase().trim(), {
    data,
    ts: Date.now(),
    hits: 0,
  });
};

/**
 * Returns cache stats (useful for debugging / monitoring).
 */
const getCacheStats = () => ({
  entries: CACHE.size,
  keys: [...CACHE.keys()],
  totalHits: [...CACHE.values()].reduce((s, e) => s + (e.hits || 0), 0),
});

/**
 * Clear the entire cache (e.g. for testing).
 */
const clearCache = () => CACHE.clear();

module.exports = { getCachedNutrition, setCachedNutrition, getCacheStats, clearCache };
