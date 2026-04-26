const fs = require("fs");
const crypto = require("crypto");

// Using native fetch (Node.js 18+)

const analyzeFoodWithOpenSource = async (imagePath, imageUrl) => {
  // 1. Identify the food using Hugging Face Free Inference API
  const hfToken = process.env.HUGGINGFACE_API_KEY; // Optional, but recommended for higher rate limits
  const imageBuffer = fs.readFileSync(imagePath);

  let detectedFoodName = "Unknown Food";
  let confidence = 0;

  try {
    const hfHeaders = {
      "Content-Type": "application/octet-stream",
    };
    if (hfToken) {
      hfHeaders["Authorization"] = `Bearer ${hfToken}`;
    }

    // Using a popular open-source food classification model
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/nateraw/food",
      {
        method: "POST",
        headers: hfHeaders,
        body: imageBuffer,
      }
    );

    if (hfResponse.ok) {
      const hfResult = await hfResponse.json();
      // hfResult is usually an array of predictions: [{ label: 'pizza', score: 0.95 }, ...]
      if (Array.isArray(hfResult) && hfResult.length > 0) {
        // Format the label (e.g., "chicken_wings" -> "Chicken Wings")
        const rawLabel = hfResult[0].label;
        detectedFoodName = rawLabel
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        confidence = hfResult[0].score;
      }
    } else {
      console.warn("Hugging Face API failed or rate limited, falling back to default.", await hfResponse.text());
      detectedFoodName = "Mixed Meal"; // Fallback
      confidence = 0.5;
    }
  } catch (error) {
    console.error("Error calling Hugging Face:", error);
    detectedFoodName = "Mixed Meal";
    confidence = 0.5;
  }

  // 2. Get Nutritional Data from OpenFoodFacts (100% Free & Open Source Database)
  let macros = {
    calories: 250,
    protein: 10,
    carbs: 20,
    fat: 10,
    fiber: 2,
  };
  let estimatedWeight = 200; // Default 200g

  try {
    const offResponse = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        detectedFoodName
      )}&search_simple=1&action=process&json=1&page_size=3`
    );

    if (offResponse.ok) {
      const offData = await offResponse.json();
      if (offData.products && offData.products.length > 0) {
        // Find a product that actually has nutriments
        const product = offData.products.find((p) => p.nutriments && p.nutriments["energy-kcal_100g"]) || offData.products[0];
        
        if (product && product.nutriments) {
          // OpenFoodFacts returns data per 100g. We estimate a standard 200g portion.
          const portionMultiplier = estimatedWeight / 100;
          
          macros = {
            calories: Math.round((product.nutriments["energy-kcal_100g"] || 250) * portionMultiplier),
            protein: Math.round((product.nutriments["proteins_100g"] || 10) * portionMultiplier),
            carbs: Math.round((product.nutriments["carbohydrates_100g"] || 20) * portionMultiplier),
            fat: Math.round((product.nutriments["fat_100g"] || 10) * portionMultiplier),
            fiber: Math.round((product.nutriments["fiber_100g"] || 2) * portionMultiplier),
          };
        }
      }
    }
  } catch (error) {
    console.error("Error calling OpenFoodFacts:", error);
  }

  // 3. Construct and return the final data object expected by the frontend
  return {
    id: crypto.randomUUID(),
    imageUrl,
    foods: [
      {
        name: detectedFoodName,
        confidence: confidence,
      },
    ],
    macros: macros,
    volume: estimatedWeight * 1.2, // Rough volume estimation (cm³)
    weight: estimatedWeight, // grams
    createdAt: new Date().toISOString(),
  };
};

module.exports = { analyzeFoodWithOpenSource };
