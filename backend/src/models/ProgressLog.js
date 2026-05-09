const mongoose = require("mongoose");

const progressLogSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    weight_kg: {
      type: Number,
      required: true,
    },
    image_url: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    collection: "progress_logs",
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

// We might want multiple logs a day, but usually it's one. Let's not restrict uniqueness in case they want to log twice.

const ProgressLog = mongoose.models.ProgressLog || mongoose.model("ProgressLog", progressLogSchema);

module.exports = { ProgressLog };
