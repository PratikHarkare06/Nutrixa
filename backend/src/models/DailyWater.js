const mongoose = require("mongoose");

const dailyWaterSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    water_intake_ml: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: "daily_water",
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

// Ensure only one entry per day
dailyWaterSchema.index({ date: 1 }, { unique: true });

const DailyWater = mongoose.models.DailyWater || mongoose.model("DailyWater", dailyWaterSchema);

module.exports = { DailyWater };
