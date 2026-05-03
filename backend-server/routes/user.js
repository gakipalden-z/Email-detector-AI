// routes/user.js

const express = require("express");

const {
  login,
  register,
  getAllusers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  suspendUser
} = require("../controller/auth");

const {
  verify2FA,
  verifyLogin2FA
} = require("../controller/verify2fa");

const { verifyToken } = require("../middleware/auth");
const { setup2FA } = require("../config/qr");

const userRoutes = express.Router();

// REGISTER
userRoutes.post("/register", register);

// LOGIN
userRoutes.post("/login", login);

// ADMIN / USER MANAGEMENT
userRoutes.get("/all", getAllusers);
userRoutes.put("/status/:id", updateUserStatus);
userRoutes.put("/role/:id", updateUserRole);
userRoutes.delete("/delete/:id", deleteUser);
userRoutes.put("/suspend/:id", suspendUser);

// 2FA SETUP (must be logged in)
userRoutes.post("/2fa/setup", verifyToken, setup2FA);

// ENABLE 2FA
userRoutes.post("/2fa/verify", verifyToken, verify2FA);

// LOGIN STEP 2
userRoutes.post("/2fa/login", verifyLogin2FA);

// ✅ FIXED EXPORT
module.exports = { userRoutes };