const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { createAppError } = require("../utils/createAppError");

const uploadsDirectory = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, extension).replace(/\s+/g, "-");
    callback(null, `${Date.now()}-${baseName}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(createAppError(400, "INVALID_FILE_TYPE", "Unsupported file format. Please upload JPG, PNG, or JPEG."));
      return;
    }

    callback(null, true);
  },
});

const uploadImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(createAppError(400, "FILE_TOO_LARGE", "File size exceeds 10MB limit."));
      return;
    }

    if (error.code === "INVALID_FILE_TYPE") {
      next(error);
      return;
    }

    next(createAppError(500, "UPLOAD_FAILED", "Upload failed. Please try again."));
  });
};

const allowedAudioMimeTypes = ["audio/webm", "audio/ogg", "audio/wav", "audio/mp4", "audio/mpeg", "audio/x-m4a", "audio/m4a", "video/webm"];

const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedAudioMimeTypes.includes(file.mimetype) && !file.mimetype.startsWith("audio/") && !file.mimetype.startsWith("video/")) {
      callback(createAppError(400, "INVALID_FILE_TYPE", `Unsupported audio format: ${file.mimetype}`));
      return;
    }
    callback(null, true);
  },
});

const uploadAudioMiddleware = (req, res, next) => {
  uploadAudio.single("audio")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(createAppError(400, "FILE_TOO_LARGE", "Audio file size exceeds 15MB limit."));
      return;
    }

    next(createAppError(500, "UPLOAD_FAILED", `Audio upload failed: ${error.message}`));
  });
};

module.exports = { uploadImage, uploadAudioMiddleware };
