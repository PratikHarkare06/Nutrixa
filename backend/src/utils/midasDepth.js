/**
 * midasDepth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Node.js wrapper around midas_depth.py.
 * Spawns the Python process with the image path + YOLO bbox ratio and returns
 * a parsed result object. Falls back gracefully if Python/MiDaS is unavailable.
 */

const fetch = require("node-fetch");
const path = require("path");

/**
 * Run MiDaS depth estimation on a food image by calling the ML Server.
 *
 * @param {string} imagePath  Absolute path to the uploaded image.
 * @param {number} bboxRatio  YOLO bbox area ratio (0–1), used to locate food region.
 * @returns {Promise<{
 *   success: boolean,
 *   method: string,
 *   volume_cm3?: number,
 *   weight_g?: number,
 *   depth_mean?: number,
 *   depth_std?: number,
 *   error?: string
 * }>}
 */
const runMiDaS = async (imagePath, bboxRatio = 0.5) => {
  try {
    const res = await fetch("http://localhost:8000/depth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_path: imagePath, bbox_ratio: bboxRatio })
    });

    if (!res.ok) {
      console.warn(`[MiDaS] ML Server returned ${res.status} — using fallback volume.`);
      return { success: false, method: "fallback", error: "ML Server Error" };
    }

    const result = await res.json();
    if (result.success) {
      console.log(
        `[MiDaS] ✓ Volume: ${result.volume_cm3} cm³ | Weight: ${result.weight_g} g` +
        ` | depth_mean: ${result.depth_mean}`
      );
    } else {
      console.warn("[MiDaS] Depth estimation failed:", result.error);
    }
    return result;
  } catch (error) {
    console.error("[MiDaS] ML Server connection failed:", error.message);
    return { success: false, method: "fallback", error: "ML Server unavailable" };
  }
};

module.exports = { runMiDaS };
