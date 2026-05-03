// test/routes/user.routes.test.js

const request = require("supertest");
const express = require("express");
const { userRoutes } = require("../../routes/user");

// 🔥 MOCK CONTROLLERS
jest.mock("../../controller/auth", () => ({
  register: (req, res) => res.status(200).json({ message: "registered" }),
  login: (req, res) => res.status(200).json({ message: "logged in" }),
  getAllusers: (req, res) => res.status(200).json([{ name: "Choki" }]),
  updateUserStatus: (req, res) => res.status(200).json({ message: "status updated" }),
  updateUserRole: (req, res) => res.status(200).json({ message: "role updated" }),
  deleteUser: (req, res) => res.status(200).json({ message: "deleted" }),
  suspendUser: (req, res) => res.status(200).json({ message: "suspended" })
}));

jest.mock("../../controller/verify2fa", () => ({
  verify2FA: (req, res) => res.status(200).json({ message: "2FA enabled" }),
  verifyLogin2FA: (req, res) => res.status(200).json({ token: "jwt-token" })
}));

// 🔥 MOCK MIDDLEWARE
jest.mock("../../middleware/auth", () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: "123", role: "user" };
    next();
  }
}));

jest.mock("../../config/qr", () => ({
  setup2FA: (req, res) => res.status(200).json({ message: "QR generated" })
}));

// 🔧 EXPRESS APP
const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

describe("User Routes Tests", () => {

  // ============================
  // REGISTER
  // ============================
  test("POST /register", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ name: "Choki" });

    expect(res.statusCode).toBe(200);
  });

  // ============================
  // LOGIN
  // ============================
  test("POST /login", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "test@mail.com" });

    expect(res.statusCode).toBe(200);
  });

  // ============================
  // GET USERS
  // ============================
  test("GET /all", async () => {
    const res = await request(app).get("/api/users/all");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // ============================
  // UPDATE STATUS
  // ============================
  test("PUT /status/:id", async () => {
    const res = await request(app)
      .put("/api/users/status/123")
      .send({ status: "accepted" });

    expect(res.statusCode).toBe(200);
  });

  // ============================
  // UPDATE ROLE
  // ============================
  test("PUT /role/:id", async () => {
    const res = await request(app)
      .put("/api/users/role/123")
      .send({ role: "admin" });

    expect(res.statusCode).toBe(200);
  });

  // ============================
  // DELETE USER
  // ============================
  test("DELETE /delete/:id", async () => {
    const res = await request(app)
      .delete("/api/users/delete/123");

    expect(res.statusCode).toBe(200);
  });

  // ============================
  // SUSPEND USER
  // ============================
  test("PUT /suspend/:id", async () => {
    const res = await request(app)
      .put("/api/users/suspend/123");

    expect(res.statusCode).toBe(200);
  });

  // ============================
  // 2FA SETUP (with token)
  // ============================
  test("POST /2fa/setup", async () => {
    const res = await request(app)
      .post("/api/users/2fa/setup")
      .set("Authorization", "Bearer token");

    expect(res.statusCode).toBe(200);
  });

  // ============================
  // 2FA VERIFY
  // ============================
  test("POST /2fa/verify", async () => {
    const res = await request(app)
      .post("/api/users/2fa/verify")
      .set("Authorization", "Bearer token")
      .send({ token: "123456" });

    expect(res.statusCode).toBe(200);
  });

  // ============================
  // 2FA LOGIN
  // ============================
  test("POST /2fa/login", async () => {
    const res = await request(app)
      .post("/api/users/2fa/login")
      .send({ userId: "123", token: "123456" });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

});