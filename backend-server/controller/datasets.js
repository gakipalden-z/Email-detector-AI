// controllers/datasets.js

const fs = require("fs");
const path = require("path");
const Dataset = require("../models/Dataset");

// GET ALL DATASETS
const getAllDatasets = async (req, res) => {
  try {
    const dirPath = path.join(process.cwd(), "uploads", "datasets");

    if (!fs.existsSync(dirPath)) {
      return res.json([]);
    }

    const files = fs.readdirSync(dirPath);

    const datasets = [];

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      const data = await Dataset.findOne({ dataset_name: file });

      datasets.push({
        name: file,
        size: stats.size,
        createdAt: stats.birthtime,
        preprocessing_status: data?.preprocessing_status || "pending",
        text_column: data?.text_column || null,
        total_rows: data?.total_rows || 0,
        upload_date: data?.upload_date || stats.birthtime
      });
    }

    res.json(datasets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to read datasets folder" });
  }
};

// PREPROCESS DATA
const preprocessData = async (req, res) => {
  try {
    const { dataset, column } = req.body;

    if (!dataset || !column) {
      return res.status(400).json({
        success: false,
        message: "Dataset or column name is not submitted"
      });
    }

    // set status → in_progress
    await Dataset.findOneAndUpdate(
      { dataset_name: dataset },
      {
        preprocessing_status: "in_progress",
        text_column: column
      },
      { upsert: true }
    );

    const response = await fetch("http://127.0.0.1:8000/datasets/preprocess", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ dataset, column })
    });

    if (response.ok) {
      const result = await response.json();

      await Dataset.findOneAndUpdate(
        { dataset_name: dataset },
        {
          text_column: column,
          preprocessing_status: "processed",
          preprocessing_stats: result.stats || {},
          processed_file_name:
            result.processed_file_name || `${dataset}_processed.csv`,
          total_rows: result.total_rows || 0,
          total_columns: result.total_columns || 0
        },
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: "Dataset preprocessed successfully",
        data: result
      });
    } else {
      await Dataset.findOneAndUpdate(
        { dataset_name: dataset },
        { preprocessing_status: "failed" }
      );

      return res.status(response.status).json({
        success: false,
        message: "Preprocessing API call failed"
      });
    }
  } catch (error) {
    console.log("Preprocessing error:", error);

    await Dataset.findOneAndUpdate(
      { dataset_name: req.body.dataset },
      { preprocessing_status: "failed" }
    );

    return res.status(500).json({
      success: false,
      message: "Preprocessing failed",
      error: error.message
    });
  }
};

// EXPORT
module.exports = {
  getAllDatasets,
  preprocessData
};