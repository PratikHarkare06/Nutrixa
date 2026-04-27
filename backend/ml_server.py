"""
FastAPI server for MiDaS depth estimation.
Loads the model into RAM once and provides a lightning-fast HTTP endpoint.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import cv2
import numpy as np
import torch
import warnings

warnings.filterwarnings("ignore")

app = FastAPI(title="NutriVision ML Server")

# Global variables for model
midas = None
transform = None
device = None

@app.on_event("startup")
def load_model():
    global midas, transform, device
    print("[ML Server] Loading MiDaS model into RAM...")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    midas = torch.hub.load("intel-isl/MiDaS", "MiDaS_small", trust_repo=True, verbose=False)
    midas.eval()
    midas.to(device)
    
    midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True, verbose=False)
    transform = midas_transforms.small_transform
    
    print("[ML Server] MiDaS model loaded successfully on", device)

class DepthRequest(BaseModel):
    image_path: str
    bbox_ratio: float = 0.5

@app.post("/depth")
def estimate_depth(req: DepthRequest):
    if not midas or not transform:
        raise HTTPException(status_code=503, detail="Model not loaded")

    img = cv2.imread(req.image_path)
    if img is None:
        raise HTTPException(status_code=400, detail=f"Cannot read image: {req.image_path}")

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w = img_rgb.shape[:2]

    # Run MiDaS
    input_batch = transform(img_rgb).to(device)
    with torch.no_grad():
        depth = midas(input_batch)
        depth = torch.nn.functional.interpolate(
            depth.unsqueeze(1),
            size=(h, w),
            mode="bicubic",
            align_corners=False,
        ).squeeze().cpu().numpy()

    # Normalise depth
    d_min, d_max = float(depth.min()), float(depth.max())
    if d_max > d_min:
        depth_norm = (depth - d_min) / (d_max - d_min)
    else:
        depth_norm = np.ones_like(depth) * 0.5

    # --- OpenCV Coin Detection (Reference Scale) ---
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.medianBlur(gray, 5)
    # Detect circles (coins). Parameter 2 is inverse ratio of resolution, param 3 is min distance
    circles = cv2.HoughCircles(blurred, cv2.HOUGH_GRADIENT, dp=1.2, minDist=w/10,
                               param1=50, param2=30, minRadius=int(w*0.02), maxRadius=int(w*0.15))

    reference_found = False
    pixel_size_cm = 0.0
    plate_diameter_cm = 25.0 # default assumption

    if circles is not None:
        circles = np.round(circles[0, :]).astype("int")
        # Just take the first circle found as the coin
        (cx_coin, cy_coin, r) = circles[0]
        reference_found = True
        # Assume standard coin is ~2.4 cm in diameter (Quarter / 5 Rupee)
        coin_diameter_pixels = r * 2
        pixel_size_cm = 2.4 / coin_diameter_pixels
        print(f"[ML Server] Coin detected! Radius: {r}px, calculated pixel scale: {pixel_size_cm:.4f} cm/px")
    else:
        # Fallback to plate assumption
        plate_pixel_width = w * 0.70
        pixel_size_cm = plate_diameter_cm / plate_pixel_width

    pixel_area_cm2 = pixel_size_cm ** 2
    # Food region mask
    cx_f, cy_f = w // 2, h // 2
    side_fraction = float(req.bbox_ratio) ** 0.5
    food_w = max(1, int(w * side_fraction))
    food_h = max(1, int(h * side_fraction))
    x1, x2 = max(0, cx_f - food_w // 2), min(w, cx_f + food_w // 2)
    y1, y2 = max(0, cy_f - food_h // 2), min(h, cy_f + food_h // 2)

    mask = np.zeros((h, w), dtype=np.float32)
    mask[y1:y2, x1:x2] = 1.0

    max_food_height_cm = 6.0

    # Volume calculation
    food_depth = depth_norm * mask
    volume_cm3 = float(np.sum(food_depth) * pixel_area_cm2 * max_food_height_cm)
    weight_g = volume_cm3 * 0.80

    masked_vals = depth_norm[mask == 1.0]
    depth_mean = float(np.mean(masked_vals)) if len(masked_vals) else 0.5
    depth_std = float(np.std(masked_vals)) if len(masked_vals) else 0.0

    return {
        "success": True,
        "method": "midas_fastapi",
        "volume_cm3": round(volume_cm3, 1),
        "weight_g": round(weight_g, 1),
        "depth_mean": round(depth_mean, 3),
        "depth_std": round(depth_std, 3),
        "food_pixel_count": int(np.sum(mask)),
        "image_size": [w, h],
        "scale_info": {
            "reference_object_found": reference_found,
            "pixel_size_cm": round(pixel_size_cm, 4),
            "max_food_height_cm": max_food_height_cm,
            "plate_assumption_cm": plate_diameter_cm if not reference_found else None,
        },
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml_server:app", host="0.0.0.0", port=8000, reload=True)
