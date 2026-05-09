const express = require("express");
const { getProfile, saveProfile, suggestMeals, generateDietPlan, getProgressLogs, addProgressLog } = require("../controllers/profileController");
const { uploadImage: uploadImageMiddleware } = require("../config/multer");

const router = express.Router();

router.get("/", getProfile);
router.post("/", saveProfile);
router.post("/suggest", suggestMeals);
router.post("/diet-plan", generateDietPlan);
router.get("/progress", getProgressLogs);
router.post("/progress", uploadImageMiddleware, addProgressLog);

module.exports = router;
