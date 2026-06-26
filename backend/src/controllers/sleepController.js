const { SleepLog } = require("../models/SleepLog");
const { WorkoutLog } = require("../models/WorkoutLog");
const { FoodEntry } = require("../models/FoodEntry");
const { UserProfile } = require("../models/UserProfile");
const { callNvidiaNim } = require("../utils/nvidiaNim");
const { createAppError } = require("../utils/createAppError");

const getSleepLogs = async (req, res, next) => {
  try {
    const logs = await SleepLog.find({}).sort({ date: -1 }).limit(30).lean();
    res.status(200).json({
      success: true,
      data: logs.reverse(), // return chronological order for charts
    });
  } catch (error) {
    console.error("getSleepLogs error:", error);
    next(createAppError(500, "FETCH_FAILED", "Failed to fetch sleep logs."));
  }
};

const logSleep = async (req, res, next) => {
  try {
    const { date, duration_hours, quality_score, deep_sleep_hours, rem_sleep_hours, notes } = req.body;

    if (!date || duration_hours === undefined || quality_score === undefined) {
      return next(createAppError(400, "INVALID_DATA", "Date, duration_hours, and quality_score are required."));
    }

    const log = await SleepLog.findOneAndUpdate(
      { date },
      {
        duration_hours: Number(duration_hours),
        quality_score: Number(quality_score),
        deep_sleep_hours: Number(deep_sleep_hours || 0),
        rem_sleep_hours: Number(rem_sleep_hours || 0),
        notes: notes || "",
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("logSleep error:", error);
    next(createAppError(500, "SAVE_FAILED", "Failed to save sleep log."));
  }
};

const getSleepInsights = async (req, res, next) => {
  try {
    const sleepLogs = await SleepLog.find({}).sort({ date: -1 }).limit(5).lean();
    const workouts = await WorkoutLog.find({}).sort({ date: -1 }).limit(5).lean();
    const foods = await FoodEntry.find({}).sort({ created_at: -1 }).limit(5).lean();
    const profile = await UserProfile.findOne({ profile_key: "primary" }).lean();

    if (sleepLogs.length === 0) {
      return res.status(200).json({
        success: true,
        data: "No sleep logs recorded yet. Start logging your sleep to receive personalized AI sleep coaching!",
      });
    }

    // Format logs for LLM context
    const sleepText = sleepLogs
      .map((s) => `- ${s.date}: ${s.duration_hours}h sleep, Quality: ${s.quality_score}%, Deep Sleep: ${s.deep_sleep_hours || 0}h, REM: ${s.rem_sleep_hours || 0}h. Notes: ${s.notes || "None"}`)
      .join("\n");

    const workoutText = workouts.length > 0
      ? workouts.map((w) => `- ${w.date}: ${w.workout_name} (${w.duration_mins} mins, burned ${w.calories_burned} kcal)`).join("\n")
      : "No recent workouts logged.";

    const foodText = foods.length > 0
      ? foods.map((f) => `- Logged at ${new Date(f.created_at).toLocaleDateString()}: ${f.calories} kcal, Protein: ${f.protein}g, Carbs: ${f.carbs}g, Fat: ${f.fat}g`).join("\n")
      : "No recent food logs.";

    const prompt = `You are a world-class sleep scientist and health coach.
Analyze the user's weekly activities and sleep quality logs below. Connect the dots between their workouts, nutrition, and sleep.
Write a personalized, concise sleep report.

User details:
- Weight: ${profile ? profile.weight_kg : 60} kg, Gender: ${profile ? profile.gender : "Not specified"}
- Diet mode: ${profile ? profile.diet_mode : "Balanced"}

Recent Sleep Logs:
${sleepText}

Recent Workouts:
${workoutText}

Recent Nutrition logs:
${foodText}

Provide:
1. A summary paragraph (2-3 sentences max) identifying trends (e.g. if workout duration or calories impact sleep score).
2. exactly 2 actionable bullet points on sleep hygiene tailored to their data.

Output in clean, friendly, professional Markdown. Do not include introductory or concluding remarks outside the report.`;

    const textOutput = await callNvidiaNim(prompt);
    res.status(200).json({
      success: true,
      data: textOutput.trim(),
    });
  } catch (error) {
    console.error("getSleepInsights error:", error);
    next(createAppError(500, "GENERATION_FAILED", "Failed to generate sleep insights."));
  }
};

module.exports = {
  getSleepLogs,
  logSleep,
  getSleepInsights,
};
