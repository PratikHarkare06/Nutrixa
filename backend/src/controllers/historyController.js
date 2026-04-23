const { createAppError } = require("../utils/createAppError");
const { FoodEntry, mapFoodEntryToAnalysis } = require("../models/FoodEntry");

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
      data: historyEntries.map(mapFoodEntryToAnalysis),
      pagination: {
        limit,
        page,
        total,
      },
    });
  } catch (_error) {
    next(createAppError(500, "FETCH_FAILED", "Failed to fetch history."));
  }
};

module.exports = { getHistory };
