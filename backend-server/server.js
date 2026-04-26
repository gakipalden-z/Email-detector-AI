import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import { connectDB } from './config/db.js';
import {routes} from "./routes/routes.js"
import {userRoutes } from "./routes/user.js"
import datasetRoutes from "./routes/dataset.js";
import path from "path";

dotenv.config();
const app = express();

app.use("/datasets", express.static(path.join(process.cwd(), "uploads", "datasets")));
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "File too large",
    });
  }

  res.status(500).json({
    error: err.message || "Server error",
  });
});// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/models", routes);

app.use("/api/users", userRoutes)

app.use("/api/datasets", datasetRoutes);  

const PORT = process.env.PORT || 5000;
// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});