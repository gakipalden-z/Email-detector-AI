// test/controller/auth.test.js

const {
  register,
  login,
  getAllusers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  suspendUser
} = require("../../controller/auth");

const User = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔥 FIXED MOCK (THIS WAS YOUR MAIN ISSUE)
jest.mock("../../models/user", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn()
}));
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Auth Controller Tests", () => {

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
  // 🔹 REGISTER
  // ============================

  test("should register user successfully", async () => {
    req.body = {
      name: "Choki",
      email: "test@mail.com",
      password: "1234",
      role: "user"
    };

    bcrypt.hash.mockResolvedValue("hashed123");

    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ email: "test@mail.com" });

    await register(req, res);

    expect(User.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "User registered"
    });
  });

  test("should return error if user already exists", async () => {
    req.body = {
      name: "Choki",
      email: "test@mail.com",
      password: "1234"
    };

    User.findOne.mockResolvedValue({ email: "test@mail.com" });

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ============================
  // 🔹 LOGIN
  // ============================

  test("should return error if user not found", async () => {
    req.body = { email: "test@mail.com", password: "1234" };

    User.findOne.mockResolvedValue(null);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should return error if user not accepted", async () => {
    req.body = { email: "test@mail.com", password: "1234" };

    User.findOne.mockResolvedValue({
      status: "pending"
    });

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("should return error if user suspended", async () => {
    req.body = { email: "test@mail.com", password: "1234" };

    User.findOne.mockResolvedValue({
      status: "suspended"
    });

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("should return error if password incorrect", async () => {
    req.body = { email: "test@mail.com", password: "1234" };

    User.findOne.mockResolvedValue({
      status: "accepted",
      password: "hashed"
    });

    bcrypt.compare.mockResolvedValue(false);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should require 2FA if enabled", async () => {
    req.body = { email: "test@mail.com", password: "1234" };

    User.findOne.mockResolvedValue({
      _id: "123",
      status: "accepted",
      password: "hashed",
      twoFactorEnabled: true
    });

    bcrypt.compare.mockResolvedValue(true);

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      requires2FA: true,
      userId: "123"
    });
  });

  test("should login successfully", async () => {
    req.body = { email: "test@mail.com", password: "1234" };

    User.findOne.mockResolvedValue({
      _id: "123",
      role: "user",
      status: "accepted",
      password: "hashed",
      twoFactorEnabled: false
    });

    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("token123");

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "token123"
      })
    );
  });

  // ============================
  // 🔹 GET USERS
  // ============================

  test("should get all users", async () => {
    User.find.mockResolvedValue([{ name: "Choki" }]);

    await getAllusers(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  // ============================
  // 🔹 UPDATE STATUS
  // ============================

  test("should update user status", async () => {
    req.params = { id: "123" };
    req.body = { status: "accepted" };

    User.findByIdAndUpdate.mockResolvedValue({});

    await updateUserStatus(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test("should reject invalid status", async () => {
    req.params = { id: "123" }; // 🔥 FIXED
    req.body = { status: "wrong" };

    await updateUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ============================
  // 🔹 UPDATE ROLE
  // ============================

  test("should update user role", async () => {
    req.params = { id: "123" };
    req.body = { role: "admin" };

    User.findByIdAndUpdate.mockResolvedValue({});

    await updateUserRole(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test("should reject invalid role", async () => {
    req.params = { id: "123" }; // 🔥 FIXED
    req.body = { role: "invalid" };

    await updateUserRole(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ============================
  // 🔹 DELETE USER
  // ============================

  test("should delete user", async () => {
    req.params = { id: "123" };

    User.findByIdAndDelete.mockResolvedValue({});

    await deleteUser(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "User deleted"
    });
  });

  // ============================
  // 🔹 SUSPEND USER
  // ============================

  test("should suspend user", async () => {
    req.params = { id: "123" };

    User.findByIdAndUpdate.mockResolvedValue({});

    await suspendUser(req, res);

    expect(res.json).toHaveBeenCalled();
  });

});