const { HfInference } = require("@huggingface/inference");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let hf = null;
if (process.env.HUGGINGFACE_API_KEY) {
  try {
    hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  } catch (err) {
    console.error("Failed to initialize Hugging Face Inference client:", err);
  }
}

/**
 * Generate a realistic food photo using Hugging Face Text-to-Image model.
 * Saves the generated image in the backend's uploads directory.
 * Returns the local URL path (e.g. "/uploads/ai-xxxx.jpeg") or null on failure.
 */
const generateFoodImage = async (foodName) => {
  if (!hf) {
    console.log(`[ImageGen] Hugging Face client not initialized. Skipping image generation for "${foodName}"`);
    return null;
  }

  try {
    const prompt = `A professional food photography shot of fresh hot delicious ${foodName}, top down view, high resolution, 4k, gourmet styling, clean background, bright studio lighting, soft shadows`;
    console.log(`[ImageGen] Launching Hugging Face image generation for: "${foodName}"...`);

    const response = await hf.textToImage({
      model: "stabilityai/stable-diffusion-2-1",
      inputs: prompt,
      parameters: {
        negative_prompt: "blurry, low quality, distorted, raw meat, ugly, text, watermark, signature, frame",
      }
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, "..", "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `ai-${crypto.randomBytes(8).toString("hex")}.jpeg`;
    const filePath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filePath, buffer);
    console.log(`[ImageGen] Successfully generated AI image saved to: ${filename}`);

    return `/uploads/${filename}`;
  } catch (error) {
    console.warn(`[ImageGen] Hugging Face text-to-image generation failed for "${foodName}":`, error.message);
    return null;
  }
};

module.exports = { generateFoodImage };
