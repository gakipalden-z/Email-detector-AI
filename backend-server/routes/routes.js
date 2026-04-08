import express from "express";
import axios from "axios"
const routes = express.Router();

const fast_api_server = "http://127.0.0.1:8000"

// GET /api/test
routes.get("/test", (req, res) => {
  res.status(200).json({
    message: "API is working!",
    status: "success"
  });
});
const predictEmail = async (req, res, next) => {
  const { email_text } = req.body;
  if(!email_text){
    res.status(400).json({
      message: "Enter email to predict",
      status: "error"
    })
  }
  const data = await axios.post(`${fast_api_server}/predict`, {
    email_text: email_text
  })
  const res_data = data.data;

  res.status(200).json({
    message: res_data,
    status:"successfully predicted"
  })
};

routes.post("/predict", predictEmail)

export { routes };