const ort = require("onnxruntime-node");
const sharp = require("sharp");
const path = require("path");

let session = null;
let modelClassNames = null; // cached class names from model metadata

const initializeModel = async () => {
  if (!session) {
    const modelPath = path.join(__dirname, "..", "..", "best.onnx");
    session = await ort.InferenceSession.create(modelPath);

    // Try to extract class names from ONNX model metadata
    try {
      const meta = await session.getModelMetadata?.();
      if (meta?.customMetadataMap) {
        const namesStr = meta.customMetadataMap.get("names");
        if (namesStr) {
          // YOLOv8 stores names as a Python-dict string: {0: 'apple', 1: 'banana', ...}
          const matches = [...namesStr.matchAll(/(\d+):\s*'([^']+)'/g)];
          if (matches.length > 0) {
            modelClassNames = {};
            for (const m of matches) {
              modelClassNames[parseInt(m[1])] = m[2];
            }
          }
        }
      }
    } catch (_) {
      // metadata not available – will fall back to index-based names
    }
  }
  return session;
};

// Intersection over Union for NMS
const computeIoU = (boxA, boxB) => {
  const xA = Math.max(boxA[0], boxB[0]);
  const yA = Math.max(boxA[1], boxB[1]);
  const xB = Math.min(boxA[2], boxB[2]);
  const yB = Math.min(boxA[3], boxB[3]);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]);
  const boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]);

  return interArea / (boxAArea + boxBArea - interArea);
};

const runYoloInference = async (imagePath) => {
  try {
    const sess = await initializeModel();
    const inputSize = 640;

    // 1. Process Image using Sharp
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Get original area for final ratio if we want, but since we map to 640x640, 
    // the ratio bbox_area/640^2 is equal to the original image ratio.
    const rawData = await image
      .resize(inputSize, inputSize, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer();

    // 2. Prepare ONNX Tensor [1, 3, 640, 640]
    const float32Data = new Float32Array(3 * inputSize * inputSize);
    for (let i = 0; i < inputSize * inputSize; i++) {
      float32Data[i] = rawData[i * 3] / 255.0; // R
      float32Data[inputSize * inputSize + i] = rawData[i * 3 + 1] / 255.0; // G
      float32Data[2 * inputSize * inputSize + i] = rawData[i * 3 + 2] / 255.0; // B
    }
    const tensor = new ort.Tensor("float32", float32Data, [1, 3, inputSize, inputSize]);

    // 3. Run Inference
    const feeds = {};
    feeds[sess.inputNames[0]] = tensor;
    const results = await sess.run(feeds);
    
    // Output is typically [1, num_classes + 4, 8400]
    const output = results[sess.outputNames[0]];
    const data = output.data;
    const dims = output.dims; // e.g. [1, 84, 8400]

    const numBoxes = dims[2];
    const numClasses = dims[1] - 4;

    let boxes = [];

    // 4. Extract boxes with class index
    for (let i = 0; i < numBoxes; i++) {
      let maxClassScore = 0;
      let maxClassIdx = 0;

      for (let c = 0; c < numClasses; c++) {
        const score = data[(4 + c) * numBoxes + i];
        if (score > maxClassScore) {
          maxClassScore = score;
          maxClassIdx = c;
        }
      }

      if (maxClassScore > 0.25) {
        const cx = data[0 * numBoxes + i];
        const cy = data[1 * numBoxes + i];
        const w = data[2 * numBoxes + i];
        const h = data[3 * numBoxes + i];

        const x1 = cx - w / 2;
        const y1 = cy - h / 2;
        const x2 = cx + w / 2;
        const y2 = cy + h / 2;

        boxes.push({ box: [x1, y1, x2, y2], score: maxClassScore, classIdx: maxClassIdx, w, h });
      }
    }

    // 5. Non-Maximum Suppression (NMS)
    boxes.sort((a, b) => b.score - a.score);
    const finalBoxes = [];
    while (boxes.length > 0) {
      const current = boxes.shift();
      finalBoxes.push(current);
      boxes = boxes.filter((b) => computeIoU(current.box, b.box) < 0.45);
    }

    // 6. Calculate total area ratio
    let totalBboxArea = 0;
    for (const b of finalBoxes) {
      totalBboxArea += (b.w * b.h);
    }

    const imageArea = inputSize * inputSize;
    let ratio = totalBboxArea / imageArea;

    // Cap ratio at 1.0 (sometimes bboxes overlap slightly)
    if (ratio > 1.0) ratio = 1.0;
    if (ratio === 0) ratio = 0.5; // Fallback if no boxes detected

    // 7. Build deduplicated ingredient list from detected classes
    // Track best confidence per class so each ingredient appears once
    const classConfidenceMap = {};
    for (const b of finalBoxes) {
      const className = modelClassNames?.[b.classIdx]
        ?? `ingredient_${b.classIdx}`;
      if (!classConfidenceMap[className] || b.score > classConfidenceMap[className]) {
        classConfidenceMap[className] = b.score;
      }
    }

    const detectedIngredients = Object.entries(classConfidenceMap).map(
      ([name, confidence]) => ({ name, confidence })
    );

    return {
      ratio,
      boxCount: finalBoxes.length,
      detectedIngredients, // [{name, confidence}, ...]
      boxes: finalBoxes.map(b => [
        b.box[0] / inputSize,
        b.box[1] / inputSize,
        b.box[2] / inputSize,
        b.box[3] / inputSize
      ]), // [ [x1_ratio, y1_ratio, x2_ratio, y2_ratio], ... ]
    };
  } catch (error) {
    console.error("YOLO Inference Error:", error);
    // Fallback to standard 0.5 ratio if ONNX fails
    return { ratio: 0.5, boxCount: 1, detectedIngredients: [], boxes: [] };
  }
};

module.exports = { runYoloInference };
