// routes/dataset.js

const multer = require("multer");
const express = require("express");
const { upload } = require("../middleware/multer");
const { getAllDatasets, preprocessData, trainModel, getDatset} = require("../controller/datasets");
const Dataset = require("../models/Dataset");
const fs = require("fs");

const routes = express.Router();

// UPLOAD ROUTE
routes.post("/upload", upload.single("dataset"), async (req, res) => {
  console.log("Received upload request");
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("File saved:", req.file.path);

    const dataset = new Dataset({
      dataset_name: req.file.filename,
      upload_date: new Date(),
      preprocessing_status: "pending",
      training_status: "pending",
      processed_file_name: req.file.filename,
      created_by: req.user?.email || "anonymous",
    });

    const savedDataset = await dataset.save();

    return res.status(200).json({
      message: "File uploaded successfully",
      file: {
        displayName: req.file.originalname,
        storedName: req.file.filename,
        path: req.file.path
      },
      datasetId: savedDataset._id,
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// OTHER ROUTES
routes.get("/all", getAllDatasets);
routes.post("/preprocess", preprocessData);
routes.post("/train", trainModel);
routes.get("/results/:datasetName", getDatset);

module.exports = routes;