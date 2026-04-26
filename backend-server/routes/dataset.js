import multer from "multer";
import express from "express";
import { upload } from "../middleware/multer.js";
import { getAllDatasets } from "../controller/datasets.js";

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

routes.post("/upload", upload.single("dataset"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("File saved:", req.file.path);

    // ✅ SEND RESPONSE FIRST
    res.json({
      message: "File uploaded successfully",
      file: req.file.filename,
    });

    // 🚀 THEN process in background (important)
    // processFile(req.file.path);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
routes.get("/all", getAllDatasets);

export default routes;