const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const crypto = require("crypto");

const analyzeFoodImageWithGemini = async (imagePath, mimeType, imageUrl) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  const prompt = `You are a professional nutritionist and image recognition AI. Analyze this food image and estimate the nutritional content.
Please output ONLY a valid JSON object without any markdown wrapping or additional text.
The JSON must strictly follow this structure:
{
  "foods": [
    {
      "name": "Food Name (e.g., Grilled Chicken, Brown Rice, etc)",
      "confidence": 0.95
    }
  ],
  "macros": {
    "calories": 400,
    "protein": 20,
    "carbs": 30,
    "fat": 15,
    "fiber": 5
  },
  "volume": 200,
  "weight": 250
}
Ensure the estimated weight is in grams (g) and volume is in cubic centimeters (cm³). Confidence should be a float between 0 and 1.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text();
    const parsedData = JSON.parse(textOutput);

    // Build final analysis object expected by the rest of the application
    return {
      id: crypto.randomUUID(),
      imageUrl,
      foods: parsedData.foods || [],
      macros: parsedData.macros || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      },
      volume: parsedData.volume || 0,
      weight: parsedData.weight || 0,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze food image with Gemini.");
  }
};

module.exports = { analyzeFoodImageWithGemini };
