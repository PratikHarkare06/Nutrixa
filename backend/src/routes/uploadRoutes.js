const express = require("express");
const { getHistory } = require("../controllers/historyController");
const { getProfile, saveProfile } = require("../controllers/profileController");
const { uploadImage: uploadImageMiddleware } = require("../config/multer");
const { uploadImage } = require("../controllers/uploadController");

const router = express.Router();

router.get("/history", getHistory);
router.get("/profile", getProfile);
router.post("/profile", saveProfile);
router.post("/upload", uploadImageMiddleware, uploadImage);

module.exports = router;
