// middleware/multer.js

const multer = require("multer");
const path = require("path");

// STORAGE CONFIG
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/datasets/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

// FILE FILTER (ONLY CSV)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext !== ".csv") {
    return cb(new Error("Only CSV files allowed"), false);
  }

  cb(null, true);
};

// MULTER INSTANCE
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // ⚠️ actually 200MB (not 50MB)
  },
});

module.exports = { upload };