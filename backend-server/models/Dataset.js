const mongoose = require("mongoose");

const datasetSchema = new mongoose.Schema({
  dataset_name: { type: String, required: true },
  upload_date: { type: Date, default: Date.now },
  total_rows: { type: Number, default: 0 },
  total_columns: { type: Number, default: 0 },
  text_column: { type: String },
  label_column: { type: String },
  preprocessing_status: { 
    type: String, 
    enum: ["pending", "in_progress", "completed", "failed", "skipped"], 
    default: "pending" 
  },
  training_status: { 
    type: String, 
    enum: ["pending", "in_progress", "completed", "failed", "cancelled"], 
    default: "pending" 
  },
  selected_model: { 
    type: String, 
    enum: ["logistic", "distilbert", "random_forest", "svm"] 
  },
  model_accuracy: { type: Number },
  model_f1_score: { type: Number },
  processed_file_name: { type: String },
  preprocessing_stats: { type: Object, default: {} },
  created_by: { type: String },
}, { timestamps: true });

const Dataset = mongoose.model("Dataset", datasetSchema);
module.exports = Dataset;