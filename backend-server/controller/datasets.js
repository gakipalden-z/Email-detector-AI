// controllers/datasets.js

const fs = require("fs");
const path = require("path");
const Dataset = require("../models/Dataset");
const { route } = require("../routes/dataset");
const dotenv = require("dotenv");

dotenv.config();

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
        training_status: data?.training_status,
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

    const response = await fetch(`${process.env.AI_SERVER}/datasets/preprocess`, {
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
        { preprocessing_status: "uploaded" }
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
      { preprocessing_status: "uploaded" }
    );

    return res.status(500).json({
      success: false,
      message: "Preprocessing failed",
      error: error.message
    });
  }
};

const trainModel = async (req, res) => {
  try{
    const { dataset, model, text_column, label_column } = req.body;
    if (!dataset || !model) {
      return res.status(400).json({
        success: false,
        message: "Dataset or model name is not submitted"
      });
    } 
    // post to ai server
    const response = await fetch(`${process.env.AI_SERVER}/models/train`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ dataset, model, text_column, label_column })
    });
  
    const result = await response.json();
    console.log("train result ", result,);
    await Dataset.findOneAndUpdate(
      { dataset_name: dataset },
      { training_status:"trained",
        preprocessing_status: "completed",
          model_accuracy: result.accuracy,
          model_f1_score: result.f1_score,
          selected_model: result.model
        },
      { upsert: true }
    );


    
    return res.status(200).json(result);
  } catch (err) {
    console.error("Training error:", err);
    res.status(500).json({ error: err.message });
  }
};
// =========================
// GET TRAINING RESULTS FOR A DATASET
// =========================
const getDatset = async (req, res) => {
  try {
    const { datasetName } = req.params;
    
    console.log(`Fetching training results for: ${datasetName}`);

    // Find the dataset in MongoDB
    const dataset = await Dataset.findOne({ dataset_name: datasetName });

    if (!dataset) {
      return res.status(404).json({ 
        error: "Dataset not found",
        dataset_name: datasetName 
      });
    }

    // Check if training has been completed
    if (dataset.training_status !== "trained") {
      return res.status(404).json({ 
        error: `Training not completed yet. Current status: ${dataset.training_status}`,
        training_status: dataset.training_status
      });
    }

    // Check if we have accuracy and f1_score
    if (!dataset.model_accuracy || !dataset.model_f1_score) {
      return res.status(404).json({ 
        error: "No training results found for this dataset",
        model_accuracy: dataset.model_accuracy,
        model_f1_score: dataset.model_f1_score
      });
    }

    console.log("data", dataset)
    // Return the results
    res.json({
      model: dataset.selected_model == "Logistic Regression" ? "Logistic Regression" : "DistilBERT",
      accuracy: dataset.model_accuracy,
      f1_score: dataset.model_f1_score,
      trained_at: dataset.updatedAt || dataset.training_completed_at,
      dataset_name: dataset.dataset_name
    });

  } catch (err) {
    console.error("Error fetching training results:", err);
    res.status(500).json({ 
      error: "Internal server error",
      message: err.message 
    });
  }
};

// EXPORT
module.exports = {
  getAllDatasets,
  preprocessData,
  trainModel,
  getDatset
};
