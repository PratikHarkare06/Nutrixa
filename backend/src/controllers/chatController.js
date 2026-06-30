const { UserProfile } = require("../models/UserProfile");
const { FoodEntry } = require("../models/FoodEntry");
const { DailyWater } = require("../models/DailyWater");
const { generateChatResponse } = require("../services/geminiAnalysisService");
const { createAppError } = require("../utils/createAppError");

const handleChat = async (req, res, next) => {
  try {
    const { message, history, context: clientContext } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return next(createAppError(400, "INVALID_DATA", "Message is required."));
    }

    // 1. Fetch user profile based on logged-in user
    let profile = null;
    if (req.user) {
      profile = await UserProfile.findOne({ userId: req.user._id }).lean();
    }
    if (!profile) {
      profile = await UserProfile.findOne({ profile_key: "primary" }).lean();
    }
    
    const userName = req.user?.name || profile?.name || "User";
    
    // 2. Fetch today's food entries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayMeals = await FoodEntry.find({
      created_at: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    // Calculate today's totals
    let caloriesLogged = 0;
    let proteinLogged = 0;
    let carbsLogged = 0;
    let fatLogged = 0;

    todayMeals.forEach(meal => {
      caloriesLogged += meal.calories || 0;
      proteinLogged += meal.protein || 0;
      carbsLogged += meal.carbs || 0;
      fatLogged += meal.fat || 0;
    });

    // 3. Fetch today's water intake
    const todayStr = new Date().toISOString().split("T")[0];
    const waterLog = await DailyWater.findOne({ date: todayStr }).lean();
    const waterLoggedMl = waterLog ? waterLog.water_intake_ml : 0;

    // 4. Construct unified context
    const context = {
      profile,
      userName,
      todayMeals,
      caloriesLogged,
      proteinLogged,
      carbsLogged,
      fatLogged,
      waterLoggedMl,
      pantryIngredients: clientContext?.pantryIngredients || [],
    };

    // 5. Generate AI Chatbot Response
    const reply = await generateChatResponse(message.trim(), history || [], context);

    res.status(200).json({
      success: true,
      text: reply,
    });
  } catch (error) {
    console.error("Chat Controller Error:", error);
    next(createAppError(500, "CHAT_FAILED", "Failed to generate chat response. Please try again."));
  }
};

module.exports = { handleChat };
