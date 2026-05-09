const express = require("express");
const { generateWorkoutPlan, getWorkoutPlan } = require("../controllers/workoutController");

const router = express.Router();

router.get("/", getWorkoutPlan);
router.post("/generate", generateWorkoutPlan);

module.exports = router;
