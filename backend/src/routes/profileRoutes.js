const express = require("express");
const { getProfile, saveProfile, suggestMeals, generateDietPlan, getProgressLogs, addProgressLog, generateGroceryList } = require("../controllers/profileController");
const { generateZeroWasteRecipe } = require("../controllers/zeroWasteController");
const { uploadImage: uploadImageMiddleware } = require("../config/multer");

const router = express.Router();

router.get("/", getProfile);
router.post("/", saveProfile);
router.post("/suggest", suggestMeals);
router.post("/diet-plan", generateDietPlan);
router.get("/progress", getProgressLogs);
router.post("/progress", uploadImageMiddleware, addProgressLog);
router.post("/grocery-list", generateGroceryList);
router.post("/zero-waste-recipe", generateZeroWasteRecipe);

module.exports = router;
