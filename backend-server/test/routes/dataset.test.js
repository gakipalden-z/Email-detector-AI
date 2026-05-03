// test/routes/dataset.routes.test.js

const request = require("supertest");
const express = require("express");

// 🔥 Mock multer to inject req.file
jest.mock("../../middleware/multer", () => ({
  upload: {
    single: () => (req, res, next) => {
      // default: pretend a file was uploaded
      req.file = {
        originalname: "sample.csv",
        filename: "123-sample.csv",
        path: "uploads/datasets/123-sample.csv"
      };
      next();
    }
  }
}));

// 🔥 Mock controller handlers (for /all and /preprocess)
jest.mock("../../controller/datasets", () => ({
  getAllDatasets: (req, res) => res.status(200).json([{ name: "file1.csv" }]),
  preprocessData: (req, res) =>
    res.status(200).json({ success: true, message: "preprocessed" })
}));

// 🔥 Mock Dataset model (constructor + save)
jest.mock("../../models/Dataset", () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    _id: "fake-id",
    save: jest.fn().mockResolvedValue({ _id: "fake-id", ...data })
  }));
});

const Dataset = require("../../models/Dataset");

// 🔧 Build app
const datasetRoutes = require("../../routes/dataset");
const app = express();
app.use(express.json());
app.use("/api/datasets", datasetRoutes);

describe("Dataset Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================
  // ❌ NO FILE
  // ============================
  test("POST /upload should return 400 if no file uploaded", async () => {
  jest.resetModules(); // 🔥 important

  // 🔥 mock multer to NOT attach file
  jest.doMock("../../middleware/multer", () => ({
    upload: {
      single: () => (req, res, next) => {
        req.file = undefined;
        next();
      }
    }
  }));

  const express = require("express");
  const datasetRoutes = require("../../routes/dataset");

  const app = express();
  app.use(express.json());
  app.use("/api/datasets", datasetRoutes);

  const res = await request(app)
    .post("/api/datasets/upload")
    .send({});

  expect(res.statusCode).toBe(400);
});

  // ============================
  // ✅ SUCCESS UPLOAD
  // ============================
  test("POST /upload should upload and save dataset", async () => {
    // ensure default mock sets req.file
    const res = await request(app)
      .post("/api/datasets/upload")
      .send({});

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("File uploaded successfully");

    // constructor called
    expect(Dataset).toHaveBeenCalled();

    // instance.save called
    const instance = Dataset.mock.results[0].value;
    expect(instance.save).toHaveBeenCalled();
  });

  // ============================
  // 💥 SAVE ERROR
  // ============================
  test("POST /upload should handle DB error", async () => {
    // force save to throw
    Dataset.mockImplementationOnce((data) => ({
      ...data,
      save: jest.fn().mockRejectedValue(new Error("DB error"))
    }));

    const res = await request(app)
      .post("/api/datasets/upload")
      .send({});

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBeDefined();
  });

  // ============================
  // 🔹 GET ALL
  // ============================
  test("GET /all should return datasets", async () => {
    const res = await request(app).get("/api/datasets/all");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ============================
  // 🔹 PREPROCESS
  // ============================
  test("POST /preprocess should call preprocess controller", async () => {
    const res = await request(app)
      .post("/api/datasets/preprocess")
      .send({ dataset: "file.csv", column: "text" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});