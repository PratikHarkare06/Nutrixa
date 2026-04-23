const crypto = require("crypto");

const buildMockAnalysis = (imageUrl) => ({
  id: crypto.randomUUID(),
  imageUrl,
  foods: [
    {
      name: "Grilled Chicken",
      confidence: 0.92,
    },
    {
      name: "Brown Rice",
      confidence: 0.89,
    },
    {
      name: "Steamed Broccoli",
      confidence: 0.86,
    },
  ],
  macros: {
    calories: 520,
    protein: 35,
    carbs: 50,
    fat: 18,
    fiber: 6,
  },
  volume: 350,
  weight: 420,
  createdAt: new Date().toISOString(),
});

module.exports = { buildMockAnalysis };
