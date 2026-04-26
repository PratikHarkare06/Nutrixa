/**
 * midasDepth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Node.js wrapper around midas_depth.py.
 * Spawns the Python process with the image path + YOLO bbox ratio and returns
 * a parsed result object. Falls back gracefully if Python/MiDaS is unavailable.
 */

const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const PYTHON_BIN = path.join(__dirname, "..", "..", "venv", "bin", "python3");
const SCRIPT_PATH = path.join(__dirname, "..", "..", "midas_depth.py");
const TIMEOUT_MS = 60_000; // 60 s — first run downloads the model (~25 MB)

/**
 * Run MiDaS depth estimation on a food image.
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
const runMiDaS = (imagePath, bboxRatio = 0.5) => {
  return new Promise((resolve) => {
    // Guard: Python binary and script must exist
    if (!fs.existsSync(PYTHON_BIN)) {
      console.warn("[MiDaS] Python venv not found — skipping depth estimation.");
      return resolve({ success: false, method: "fallback", error: "Python venv not found" });
    }
    if (!fs.existsSync(SCRIPT_PATH)) {
      console.warn("[MiDaS] midas_depth.py not found — skipping depth estimation.");
      return resolve({ success: false, method: "fallback", error: "midas_depth.py not found" });
    }

    let settled = false;
    const settle = (result) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    // Kill process if it exceeds the timeout
    const timer = setTimeout(() => {
      console.warn("[MiDaS] Depth estimation timed out — using fallback volume.");
      settle({ success: false, method: "fallback", error: "timeout" });
    }, TIMEOUT_MS);

    execFile(
      PYTHON_BIN,
      [SCRIPT_PATH, imagePath, String(bboxRatio)],
      { maxBuffer: 1024 * 1024 }, // 1 MB stdout buffer
      (error, stdout, stderr) => {
        clearTimeout(timer);

        if (error) {
          console.error("[MiDaS] Process error:", error.message);
          if (stderr) console.error("[MiDaS] stderr:", stderr.slice(0, 400));
          return settle({ success: false, method: "fallback", error: error.message });
        }

        if (stderr && stderr.includes("Error")) {
          console.warn("[MiDaS] Python stderr:", stderr.slice(0, 400));
        }

        try {
          const result = JSON.parse(stdout.trim());
          if (result.success) {
            console.log(
              `[MiDaS] ✓ Volume: ${result.volume_cm3} cm³ | Weight: ${result.weight_g} g` +
              ` | depth_mean: ${result.depth_mean}`
            );
          } else {
            console.warn("[MiDaS] Depth estimation failed:", result.error);
          }
          settle(result);
        } catch (parseErr) {
          console.error("[MiDaS] JSON parse error. stdout:", stdout.slice(0, 200));
          settle({ success: false, method: "fallback", error: "JSON parse error" });
        }
      }
    );
  });
};

module.exports = { runMiDaS };
