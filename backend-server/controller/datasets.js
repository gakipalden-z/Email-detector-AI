import fs from "fs";
import path from "path";

export const getAllDatasets = async (req, res) => {
  try {
    const dirPath = path.join(process.cwd(), "uploads", "datasets");

    // check if folder exists
    if (!fs.existsSync(dirPath)) {
      return res.json([]); // no datasets yet
    }

    const files = fs.readdirSync(dirPath);

    const datasets = files.map((file) => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      return {
        name: file,
        size: stats.size,
        createdAt: stats.birthtime,
      };
    });

    res.json(datasets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to read datasets folder" });
  }
};