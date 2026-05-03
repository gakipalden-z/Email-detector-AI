import multer from "multer";
import express from "express";
import { upload } from "../middleware/multer.js";
import { getAllDatasets, preprocessData } from "../controller/datasets.js";
import { Dataset } from "../models/Dataset.js";
import fs from "fs"

const routes = express.Router();
// routes.post("/upload", (req, res) => {
//   upload.single("dataset")(req, res, function (err) {

//     // 🔥 LOG ERROR IN TERMINAL
//     if (err) {
//       console.error("UPLOAD ERROR:", err); // 👈 you see full error here
//     }

//     // 🔥 HANDLE MULTER ERROR
//     if (err instanceof multer.MulterError) {
//       if (err.code === "LIMIT_FILE_SIZE") {
//         console.log("File too large:", err.file); // 👈 log file info that caused the error
//         return res.status(400).json({
//           error: "File too large (max 50MB)",
//         });
//       }
//     }

//     // 🔥 OTHER ERRORS
//     if (err) {
//       return res.status(500).json({
//         error: err.message || "Upload failed",
//       });
//     }
//     console.log("File uploaded successfully:", req.file); // 👈 log successful upload info

//     // ✅ SUCCESS
//     res.json({
//       message: "Upload successful",
//       file: req.file,
//     });
//   });
// });

routes.post("/upload", upload.single("dataset"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("File saved:", req.file.path);
    console.log("Original name:", req.file.originalname);
    console.log("Stored name:", req.file.filename);
    
    // 💾 Save to database - use originalname for display, filename for storage reference
    const dataset = new Dataset({
      dataset_name: req.file.filename,  // Original filename for UI display
      upload_date: new Date(),
      preprocessing_status: "pending",
      training_status: "pending",
      processed_file_name: req.file.filename,  // Unique stored filename
      created_by: req.user?.email || "anonymous",
    });
    
    const savedDataset = await dataset.save();
    
    console.log("Dataset saved to DB:", {
      displayName: savedDataset.dataset_name,
      storedName: savedDataset.processed_file_name,
      id: savedDataset._id
    });

    // Send response with both names
    res.json({
      message: "File uploaded successfully",
      file: {
        displayName: req.file.originalname,  // What UI should show
        storedName: req.file.filename,       // What's actually on disk
        path: req.file.path
      },
      datasetId: savedDataset._id,
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});
routes.get("/all", getAllDatasets);
routes.post("/preprocess", preprocessData)

export default routes;