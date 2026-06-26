const express = require("express");
const { 
  getProfile, 
  saveProfile, 
  suggestMeals, 
  generateDietPlan, 
  getProgressLogs, 
  addProgressLog, 
  generateGroceryList, 
  getPantryRecipes, 
  getAllergenSubstitutes,
  getDashboardStats,
  updateWorkoutIntensity,
  modifyDietPlanMeal
} = require("../controllers/profileController");
const { generateZeroWasteRecipe } = require("../controllers/zeroWasteController");
const { uploadImage: uploadImageMiddleware } = require("../config/multer");

const router = express.Router();

router.get("/", getProfile);
router.post("/", saveProfile);
router.get("/dashboard-stats", getDashboardStats);
router.post("/workout-intensity", updateWorkoutIntensity);
router.post("/diet-plan/modify-meal", modifyDietPlanMeal);
router.post("/suggest", suggestMeals);
router.post("/diet-plan", generateDietPlan);
router.get("/progress", getProgressLogs);
router.post("/progress", uploadImageMiddleware, addProgressLog);
router.post("/grocery-list", generateGroceryList);
router.post("/zero-waste-recipe", generateZeroWasteRecipe);
router.post("/pantry-recipes", getPantryRecipes);
router.post("/allergen-substitutes", getAllergenSubstitutes);

module.exports = router;
