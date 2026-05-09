const express = require("express");
const { getHistory, getDailyWater, addWater } = require("../controllers/historyController");

const router = express.Router();

router.get("/", getHistory);
router.get("/water", getDailyWater);
router.post("/water", addWater);

module.exports = router;
