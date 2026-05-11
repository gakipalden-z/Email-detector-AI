// routes/routes.js

const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

const routes = express.Router();

dotenv.config();

const fast_api_server = process.env.AI_SERVER;
// TEST ROUTE
routes.get("/test", (req, res) => {
  res.status(200).json({
    message: "API is working!",
    status: "success"
  });
});

// PREDICT EMAIL
const predictEmail = async (req, res) => {
  try {
    const { email_text } = req.body;

    if (!email_text) {
      return res.status(400).json({
        message: "Enter email to predict",
        status: "error"
      });
    }

    const data = await axios.post(`${fast_api_server}/predict`, {
      email_text
    });

    const res_data = data.data;

    res.status(200).json({
      message: res_data,
      status: "successfully predicted"
    });

  } catch (error) {
    console.error("Prediction error:", error.message);

    res.status(500).json({
      message: "Prediction failed",
      error: error.message
    });
  }
};

// ROUTE
routes.post("/predict", predictEmail);

// ✅ FIXED EXPORT
module.exports = { routes };