const mongoose = require("mongoose");

const sleepLogSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      unique: true,
      index: true,
    },
    duration_hours: {
      type: Number,
      required: true,
      min: 0,
    },
    quality_score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    deep_sleep_hours: {
      type: Number,
      default: 0,
      min: 0,
    },
    rem_sleep_hours: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    collection: "sleep_logs",
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

const SleepLog = mongoose.models.SleepLog || mongoose.model("SleepLog", sleepLogSchema);

module.exports = { SleepLog };
