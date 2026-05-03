// test/middleware/authMiddleware.test.js

const { verifyToken } = require("../../middleware/auth");
const jwt = require("jsonwebtoken");

// 🔥 mock jwt
jest.mock("jsonwebtoken");

describe("Auth Middleware (verifyToken)", () => {

  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  // ============================
  // ❌ NO TOKEN
  // ============================

  test("should return 401 if no token provided", () => {
    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "No token"
    });
  });

  // ============================
  // ❌ INVALID TOKEN
  // ============================

  test("should return 403 if token is invalid", () => {
    req.headers.authorization = "Bearer invalidtoken";

    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid token"
    });
  });

  // ============================
  // ✅ VALID TOKEN
  // ============================

  test("should call next and attach user if token is valid", () => {
    req.headers.authorization = "Bearer validtoken";

    const decodedUser = {
      id: "123",
      role: "admin"
    };

    jwt.verify.mockReturnValue(decodedUser);

    verifyToken(req, res, next);

    expect(req.user).toEqual(decodedUser);
    expect(next).toHaveBeenCalled();
  });

});