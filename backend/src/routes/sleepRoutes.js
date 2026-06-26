const express = require("express");
const { getSleepLogs, logSleep, getSleepInsights } = require("../controllers/sleepController");

const router = express.Router();

router.get("/", getSleepLogs);
router.post("/", logSleep);
router.post("/insights", getSleepInsights);

module.exports = router;
