const { UserProfile } = require("../models/UserProfile");
const { generateZeroWasteRecipeWithGemini } = require("../services/geminiAnalysisService");
const { createAppError } = require("../utils/createAppError");

const generateZeroWasteRecipe = async (req, res, next) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return next(createAppError(400, "INVALID_DATA", "Ingredients array is required."));
    }

    const profile = await UserProfile.findOne({ profile_key: "primary" }).lean();

    const recipe = await generateZeroWasteRecipeWithGemini(ingredients, profile || {});

    res.status(200).json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error("Zero Waste Recipe Controller Error:", error);
    next(createAppError(500, "GENERATE_FAILED", "Failed to generate AI recipe. Please try again."));
  }
};

module.exports = { generateZeroWasteRecipe };
