// controllers/authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user"); // ⚠️ no {} if default export

// REGISTER
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const user = await User.create({
    name,
    email,
    password: hashed,
    status: "pending",
    role
  });

  res.json({ message: "User registered" });
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  // status check
  if (user.status !== "accepted") {
    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }
    return res.status(403).json({ message: `Status: ${user.status}` });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid password" });

  // 2FA check
  if (user.twoFactorEnabled) {
    return res.json({
      requires2FA: true,
      userId: user._id
    });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  user.password = undefined;

  res.json({ token, user });
};

// GET ALL USERS
const getAllusers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

// UPDATE STATUS
const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "accepted", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const user = await User.findByIdAndUpdate(id, { status }, { new: true });
  res.json(user);
};

// UPDATE ROLE
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["user", "researcher", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  res.json(user);
};

// DELETE USER
const deleteUser = async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.json({ message: "User deleted" });
};

// SUSPEND USER
const suspendUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(
    id,
    { status: "suspended" },
    { new: true }
  );
  res.json(user);
};

// EXPORT
module.exports = {
  register,
  login,
  getAllusers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  suspendUser
};