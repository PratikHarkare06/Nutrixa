const { createAppError } = require("../utils/createAppError");
const { FoodEntry, mapFoodEntryToAnalysis } = require("../models/FoodEntry");
const { DailyWater } = require("../models/DailyWater");
const { UserProfile } = require("../models/UserProfile");
const { awardXP } = require("../services/gamificationService");

const getHistory = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page || "1", 10) || 1, 1);
    const limit = Math.max(Number.parseInt(req.query.limit || "10", 10) || 10, 1);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const sort = req.query.sort === "asc" ? "asc" : "desc";

    const query = search
      ? {
          "foods.name": {
            $options: "i",
            $regex: search,
          },
        }
      : {};

    const total = await FoodEntry.countDocuments(query);
    const historyEntries = await FoodEntry.find(query)
      .sort({ created_at: sort === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: historyEntries.map((entry) => mapFoodEntryToAnalysis(entry, req)),
      pagination: {
        limit,
        page,
        total,
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    next(createAppError(500, "FETCH_FAILED", "Failed to fetch history."));
  }
};
const getDailyWater = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const entry = await DailyWater.findOne({ date: today }).lean();
    
    res.status(200).json({
      success: true,
      data: {
        date: today,
        water_intake_ml: entry ? entry.water_intake_ml : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

const addWater = async (req, res, next) => {
  try {
    const { amount_ml } = req.body;
    if (!amount_ml || typeof amount_ml !== "number") {
      return next(createAppError(400, "INVALID_DATA", "Amount in ml is required."));
    }

    const today = new Date().toISOString().split("T")[0];
    let entry = await DailyWater.findOneAndUpdate(
      { date: today },
      { $inc: { water_intake_ml: amount_ml } },
      { new: true, upsert: true }
    );

    if (entry.water_intake_ml < 0) {
      entry = await DailyWater.findOneAndUpdate(
        { date: today },
        { $set: { water_intake_ml: 0 } },
        { new: true }
      );
    }

    // Gamification
    await awardXP(null, "LOG_WATER", amount_ml);

    // Check if goal reached
    const profile = await UserProfile.findOne({ profile_key: "primary" }).lean();
    if (profile && entry.water_intake_ml >= profile.water_goal_ml && (entry.water_intake_ml - amount_ml) < profile.water_goal_ml) {
      await awardXP(null, "GOAL_REACHED_WATER");
    }

    res.status(200).json({
      success: true,
      data: {
        date: today,
        water_intake_ml: entry.water_intake_ml
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHistory, getDailyWater, addWater };
