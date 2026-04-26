"""
midas_depth.py
─────────────────────────────────────────────────────────────────────────────
MiDaS single-image depth estimation for food volume calculation.

Usage:
  python midas_depth.py <image_path> [bbox_ratio]

Output (stdout): JSON object with volume_cm3, weight_g, and metadata.

Volume pipeline:
  1. MiDaS generates a relative depth map (0–1, normalised).
  2. YOLO's bbox_ratio is used to approximate the food region mask
     (centred crop scaled to the detected food area fraction).
  3. Real-world scale is anchored to a standard plate assumption:
       - plate diameter = 25 cm, occupying ~70 % of frame width.
  4. Volume = Σ (depth_value × pixel_area_cm² × max_food_height_cm).
  5. Fallback: returns success=False so Node.js can use density lookup.
"""

import sys
import json
import os
import warnings

warnings.filterwarnings("ignore")


def estimate_volume(image_path: str, bbox_ratio: float = 0.5) -> dict:
    try:
        import cv2
        import numpy as np
        import torch

        # ── 1. Load MiDaS (MiDaS_small = 25 MB, fast CPU inference) ─────────
        model_type = "MiDaS_small"
        midas = torch.hub.load(
            "intel-isl/MiDaS", model_type,
            trust_repo=True,
            verbose=False,
        )
        midas.eval()

        midas_transforms = torch.hub.load(
            "intel-isl/MiDaS", "transforms",
            trust_repo=True,
            verbose=False,
        )
        transform = midas_transforms.small_transform

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        midas.to(device)

        # ── 2. Load & preprocess image ────────────────────────────────────────
        img = cv2.imread(image_path)
        if img is None:
            return {"success": False, "error": f"Cannot read image: {image_path}"}

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w = img_rgb.shape[:2]

        # ── 3. Run MiDaS depth prediction ────────────────────────────────────
        input_batch = transform(img_rgb).to(device)
        with torch.no_grad():
            depth = midas(input_batch)
            depth = torch.nn.functional.interpolate(
                depth.unsqueeze(1),
                size=(h, w),
                mode="bicubic",
                align_corners=False,
            ).squeeze().cpu().numpy()

        # Normalise depth map to [0, 1]
        d_min, d_max = float(depth.min()), float(depth.max())
        if d_max > d_min:
            depth_norm = (depth - d_min) / (d_max - d_min)
        else:
            depth_norm = np.ones_like(depth) * 0.5

        # ── 4. Build food region mask from YOLO bbox_ratio ───────────────────
        # bbox_ratio ≈ fraction of image area covered by food bboxes.
        # We approximate a centred rectangular mask of the same area fraction.
        cx, cy = w // 2, h // 2
        side_fraction = float(bbox_ratio) ** 0.5        # sqrt gives linear dim
        food_w = max(1, int(w * side_fraction))
        food_h = max(1, int(h * side_fraction))
        x1, x2 = max(0, cx - food_w // 2), min(w, cx + food_w // 2)
        y1, y2 = max(0, cy - food_h // 2), min(h, cy + food_h // 2)

        mask = np.zeros((h, w), dtype=np.float32)
        mask[y1:y2, x1:x2] = 1.0

        # ── 5. Real-world scale anchor ────────────────────────────────────────
        # Assume a standard dinner plate (25 cm diameter) fills ~70 % of width.
        plate_diameter_cm = 25.0
        plate_pixel_width = w * 0.70
        pixel_size_cm = plate_diameter_cm / plate_pixel_width
        pixel_area_cm2 = pixel_size_cm ** 2

        # Assume max food height of 6 cm (works for most dishes; adjust per category)
        max_food_height_cm = 6.0

        # ── 6. Volume calculation ─────────────────────────────────────────────
        # Volume = Σ depth_value × pixel_area × max_height
        food_depth = depth_norm * mask
        volume_cm3 = float(np.sum(food_depth) * pixel_area_cm2 * max_food_height_cm)

        # Weight estimate using average mixed-food density (0.80 g/cm³)
        weight_g = volume_cm3 * 0.80

        # Depth stats over food region (for diagnostics / confidence scoring)
        food_pixels = mask[mask == 1.0]
        masked_vals = depth_norm[mask == 1.0]
        depth_mean = float(np.mean(masked_vals)) if len(masked_vals) else 0.5
        depth_std = float(np.std(masked_vals)) if len(masked_vals) else 0.0

        return {
            "success": True,
            "method": "midas",
            "volume_cm3": round(volume_cm3, 1),
            "weight_g": round(weight_g, 1),
            "depth_mean": round(depth_mean, 3),
            "depth_std": round(depth_std, 3),
            "food_pixel_count": int(np.sum(mask)),
            "image_size": [w, h],
            "scale_info": {
                "pixel_size_cm": round(pixel_size_cm, 4),
                "max_food_height_cm": max_food_height_cm,
                "plate_assumption_cm": plate_diameter_cm,
            },
        }

    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "method": "fallback",
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: midas_depth.py <image_path> [bbox_ratio]"}))
        sys.exit(1)

    image_path = sys.argv[1]
    bbox_ratio = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5

    result = estimate_volume(image_path, bbox_ratio)
    print(json.dumps(result))
