// controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

export const register = async (req, res) => {
  const { name, email, password, role  } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashed,
    status: "pending",
    role
  });

  res.json({ message: "User registered" });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  if(user.status !== "accepted") {
    if (user.status === "suspended") {
      return res.status(403).json({ message: `Your account is suspended. Please contact support.` });
    }
    return res.status(403).json({ message: `Your registration is ${user.status}` });
  }


  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token:token, user:user });
};


export const getAllusers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "accepted", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  const user = await User.findByIdAndUpdate(id, { status }, { new: true });
  res.json(user);
};

// admin changing user roles
export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["user", "researcher", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  res.json(user);
};

// delete user by admin 
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.json({ message: "User deleted" });
};

// suspend user by admin
export const suspendUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { status: "suspended" }, { new: true });
  res.json(user);
};