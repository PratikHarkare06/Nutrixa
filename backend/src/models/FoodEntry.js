const mongoose = require("mongoose");

const foodEntrySchema = new mongoose.Schema(
  {
    foods: [
      {
        confidence: {
          type: Number,
        },
        name: {
          trim: true,
          type: String,
        },
      },
    ],
    image_url: {
      required: true,
      trim: true,
      type: String,
    },
    calories: {
      type: Number,
    },
    protein: {
      type: Number,
    },
    carbs: {
      type: Number,
    },
    fat: {
      type: Number,
    },
    fiber: {
      type: Number,
    },
    volume: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    ingredients_macros: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    collection: "food_entries",
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  },
);

const FoodEntry =
  mongoose.models.FoodEntry || mongoose.model("FoodEntry", foodEntrySchema);

const mapFoodEntryToAnalysis = (entry) => ({
  createdAt: entry.created_at,
  foods: entry.foods || [],
  id: entry._id.toString(),
  imageUrl: entry.image_url,
  macros: {
    calories: entry.calories ?? 0,
    protein: entry.protein ?? 0,
    carbs: entry.carbs ?? 0,
    fat: entry.fat ?? 0,
    fiber: entry.fiber ?? 0,
  },
  volume: entry.volume ?? 0,
  weight: entry.weight ?? 0,
  ingredientsMacros: entry.ingredients_macros instanceof Map 
    ? Object.fromEntries(entry.ingredients_macros) 
    : (entry.ingredients_macros || {}),
});

module.exports = { FoodEntry, mapFoodEntryToAnalysis };
