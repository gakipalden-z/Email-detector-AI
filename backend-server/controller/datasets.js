import fs from "fs";
import path from "path";
import { Dataset } from "../models/Dataset.js";

export const getAllDatasets = async (req, res) => {
  try {
    const dirPath = path.join(process.cwd(), "uploads", "datasets");

    // check if folder exists
    if (!fs.existsSync(dirPath)) {
      return res.json([]); // no datasets yet
    }

    const files = fs.readdirSync(dirPath);

    // Use for...of instead of map with async
    const datasets = [];
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      // Find dataset in database
      const data = await Dataset.findOne({ dataset_name: file });
      console.log("data", data, file)
      
      datasets.push({
        name: file,
        size: stats.size,
        createdAt: stats.birthtime,
        preprocessing_status: data.preprocessing_status,
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

// Call the API http://127.0.0.1:8000/datasets/preprocess
export const preprocessData = async (req, res) => {
  try {
    const { dataset, column } = req.body;
    console.log("Preprocessing dataset:", dataset);
    
    if (!dataset || !column) {
      return res.status(400).json({
        success: false,
        message: "Dataset or column name is not submitted"
      });
    }

    // Update status to in_progress in database
    await Dataset.findOneAndUpdate(
      { dataset_name: dataset },
      { 
        preprocessing_status: "in_progress",
        text_column: column
      },
      { upsert: true } // Create if doesn't exist
    );

    // Call the preprocessing API (this is calling itself - be careful!)
    // You should call your actual AI preprocessing service here
    const response = await fetch("http://127.0.0.1:8000/datasets/preprocess", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dataset: dataset, column: column }),
    });

    if (response.ok) {
      const result = await response.json();
      
      console.log("hi")
      // Save preprocessing results to database
      await Dataset.findOneAndUpdate(
        { dataset_name: dataset },
        {
          text_column: column,
          preprocessing_status: "processed",
          preprocessing_stats: result.stats || {},
          processed_file_name: result.processed_file_name || `${dataset}_processed.csv`,
          total_rows: result.total_rows || 0,
          total_columns: result.total_columns || 0
        },
        { upsert: true }
      );
      console.log("h2")
      
      return res.status(200).json({
        success: true,
        message: "Dataset preprocessed successfully",
        data: result
      });
    } else {
      // Update status to failed
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
    
    // Update status to failed in database
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