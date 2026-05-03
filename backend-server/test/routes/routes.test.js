// test/routes/routes.test.js

const request = require("supertest");
const express = require("express");
const { routes } = require("../../routes/routes");
const axios = require("axios");

// 🔥 mock axios
jest.mock("axios");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Routes Tests (/predict)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================
  // 🔹 TEST ROUTE
  // ============================

  test("GET /test should return API working", async () => {
    const res = await request(app).get("/test");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("API is working!");
  });

  // ============================
  // ❌ MISSING INPUT
  // ============================

  test("POST /predict should return 400 if email_text missing", async () => {
    const res = await request(app)
      .post("/predict")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Enter email to predict");
  });

  // ============================
  // ✅ SUCCESS CASE
  // ============================

  test("POST /predict should return prediction", async () => {
    axios.post.mockResolvedValue({
      data: "Phishing Email"
    });

    const res = await request(app)
      .post("/predict")
      .send({ email_text: "Click this link now" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Phishing Email");
  });

  // ============================
  // 💥 API FAILURE
  // ============================

  test("POST /predict should handle API failure", async () => {
    axios.post.mockRejectedValue(new Error("API down"));

    const res = await request(app)
      .post("/predict")
      .send({ email_text: "Hello" });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Prediction failed");
  });

});