const express = require("express");
const { getProfile, saveProfile } = require("../controllers/profileController");

const router = express.Router();

router.get("/", getProfile);
router.post("/", saveProfile);

module.exports = router;
