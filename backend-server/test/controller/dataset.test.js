// test/controller/datasets.test.js

const { getAllDatasets, preprocessData } = require("../../controller/datasets");
const Dataset = require("../../models/Dataset");
const fs = require("fs");

// 🔥 MOCKS
jest.mock("../../models/Dataset", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn()
}));

jest.mock("fs");

// mock fetch globally
global.fetch = jest.fn();

describe("Dataset Controller Tests", () => {

  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  // ===============================
  // 🔹 GET ALL DATASETS
  // ===============================

  test("should return empty array if folder does not exist", async () => {
    fs.existsSync.mockReturnValue(false);

    await getAllDatasets(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("should return dataset list when files exist", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue(["file1.csv"]);

    fs.statSync.mockReturnValue({
      size: 1000,
      birthtime: new Date()
    });

    Dataset.findOne.mockResolvedValue({
      preprocessing_status: "completed",
      text_column: "text",
      total_rows: 100
    });

    await getAllDatasets(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  // ===============================
  // 🔹 PREPROCESS DATA
  // ===============================

  test("should return 400 if dataset or column missing", async () => {
    req.body = {};

    await preprocessData(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should preprocess dataset successfully", async () => {
    req.body = {
      dataset: "test.csv",
      column: "text"
    };

    Dataset.findOneAndUpdate.mockResolvedValue({});

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        total_rows: 100,
        total_columns: 5
      })
    });

    await preprocessData(req, res);

    expect(fetch).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("should handle API failure", async () => {
    req.body = {
      dataset: "test.csv",
      column: "text"
    };

    Dataset.findOneAndUpdate.mockResolvedValue({});

    fetch.mockResolvedValue({
      ok: false,
      status: 500
    });

    await preprocessData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });



});