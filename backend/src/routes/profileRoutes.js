const express = require("express");
const { getProfile, saveProfile, suggestMeals } = require("../controllers/profileController");

const router = express.Router();

router.get("/", getProfile);
router.post("/", saveProfile);
router.post("/suggest", suggestMeals);

module.exports = router;
