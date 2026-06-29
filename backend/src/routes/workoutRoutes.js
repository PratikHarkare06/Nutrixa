const express = require("express");
const { generateWorkoutPlan, getWorkoutPlan, completeWorkoutSession, getWorkoutLogs } = require("../controllers/workoutController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getWorkoutPlan);
router.post("/generate", generateWorkoutPlan);
router.post("/complete", completeWorkoutSession);
router.get("/history", getWorkoutLogs);

module.exports = router;
