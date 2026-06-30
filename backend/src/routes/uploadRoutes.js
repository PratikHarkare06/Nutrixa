const express = require("express");
const { getHistory } = require("../controllers/historyController");
const { getProfile, saveProfile } = require("../controllers/profileController");
const { uploadImage: uploadImageMiddleware, uploadAudioMiddleware } = require("../config/multer");
const { uploadImage, correctIngredient, scanBarcode, analyzePantryImage, analyzeReceiptImage } = require("../controllers/uploadController");
const { parseVoiceLog, parseVoiceAudio } = require("../controllers/voiceLogController");
const { handleChat } = require("../controllers/chatController");
const { protect, optionalProtect } = require("../middleware/authMiddleware");

const { addClient } = require("../utils/progressTracker");

const router = express.Router();

router.get("/history", protect, getHistory);
router.get("/profile", protect, getProfile);
router.post("/profile", protect, saveProfile);

router.get("/upload/progress/:id", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.write("data: connected\n\n");
  addClient(req.params.id, res);
});

router.post("/upload/correct", optionalProtect, correctIngredient);
router.post("/upload/barcode", optionalProtect, scanBarcode);
router.post("/upload/pantry", optionalProtect, uploadImageMiddleware, analyzePantryImage);
router.post("/upload/receipt", optionalProtect, uploadImageMiddleware, analyzeReceiptImage);
router.post("/upload/voice-log", optionalProtect, parseVoiceLog);
router.post("/upload/voice-audio", optionalProtect, uploadAudioMiddleware, parseVoiceAudio);
router.post("/upload", optionalProtect, uploadImageMiddleware, uploadImage);
router.post("/chat", optionalProtect, handleChat);

module.exports = router;
