const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { connectDB } = require("./config/db");
const { routes } = require("./routes/routes");
const { userRoutes } = require("./routes/user");
const datasetRoutes = require("./routes/dataset");
const path = require("path");

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