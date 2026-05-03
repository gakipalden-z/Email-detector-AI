// test/controller/2fa.test.js

const { verify2FA, verifyLogin2FA } = require("../../controller/verify2fa");
const User = require("../../models/User");
const speakeasy = require("speakeasy");
const jwt = require("jsonwebtoken");

// 🔥 MOCKS
jest.mock("../../models/User", () => ({
  findById: jest.fn()
}));

jest.mock("speakeasy");
jest.mock("jsonwebtoken");

describe("2FA Controller Tests", () => {

  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  // ============================
  // 🔹 verify2FA (Enable 2FA)
  // ============================

  test("should enable 2FA successfully", async () => {
    req = {
      user: { id: "123" },
      body: { token: "123456" }
    };

    User.findById.mockResolvedValue({
      twoFactorSecret: "SECRET",
      save: jest.fn()
    });

    speakeasy.totp.mockReturnValue(true);

    await verify2FA(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "2FA enabled successfully"
    });
  });

  test("should return error if OTP invalid", async () => {
    req = {
      user: { id: "123" },
      body: { token: "123456" }
    };

    User.findById.mockResolvedValue({
      twoFactorSecret: "SECRET",
      save: jest.fn()
    });

    speakeasy.totp.mockReturnValue(false);

    await verify2FA(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ============================
  // 🔹 verifyLogin2FA
  // ============================

  test("should return error if user not found", async () => {
    req = {
      body: { userId: "123", token: "123456" }
    };

    User.findById.mockResolvedValue(null);

    await verifyLogin2FA(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return error if OTP invalid", async () => {
    req = {
      body: { userId: "123", token: "123456" }
    };

    User.findById.mockResolvedValue({
      twoFactorSecret: "SECRET"
    });

    speakeasy.totp.verify.mockReturnValue(false);

    await verifyLogin2FA(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("should login successfully with valid OTP", async () => {
    req = {
      body: { userId: "123", token: "123456" }
    };

    User.findById.mockResolvedValue({
      _id: "123",
      role: "user",
      twoFactorSecret: "SECRET",
      password: "hashed"
    });

    speakeasy.totp.verify.mockReturnValue(true);

    jwt.sign.mockReturnValue("fake-jwt-token");

    await verifyLogin2FA(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "fake-jwt-token"
      })
    );
  });

});