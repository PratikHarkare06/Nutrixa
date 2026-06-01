const express = require("express");
const { getHistory } = require("../controllers/historyController");
const { getProfile, saveProfile } = require("../controllers/profileController");
const { uploadImage: uploadImageMiddleware } = require("../config/multer");
const { uploadImage, correctIngredient, scanBarcode, analyzePantryImage, analyzeReceiptImage } = require("../controllers/uploadController");
const { parseVoiceLog } = require("../controllers/voiceLogController");
const { handleChat } = require("../controllers/chatController");

const { addClient } = require("../utils/progressTracker");

const router = express.Router();

router.get("/history", getHistory);
router.get("/profile", getProfile);
router.post("/profile", saveProfile);

router.get("/upload/progress/:id", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.write("data: connected\n\n");
  addClient(req.params.id, res);
});

router.post("/upload/correct", correctIngredient);
router.post("/upload/barcode", scanBarcode);
router.post("/upload/pantry", uploadImageMiddleware, analyzePantryImage);
router.post("/upload/receipt", uploadImageMiddleware, analyzeReceiptImage);
router.post("/upload/voice-log", parseVoiceLog);
router.post("/upload", uploadImageMiddleware, uploadImage);
router.post("/chat", handleChat);

module.exports = router;
