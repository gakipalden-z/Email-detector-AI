// const speakeasy = require("speakeasy");
// const jwt = require("jsonwebtoken");
// const { User } = require("../models/user");
import speakeasy from "speakeasy";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const verify2FA = async (req, res) => {
  const userId = req.user.id;
  const { token } = req.body;

  const user = await User.findById(userId);

  const verified = speakeasy.totp({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
    window: 1
  });

  if (!verified) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  user.twoFactorEnabled = true;
  await user.save();

  res.json({ message: "2FA enabled successfully" });
};

export const verifyLogin2FA = async (req, res) => {
  const { userId, token } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(400).json({ message: "User not found" });

  console.log("Verifying 2FA for user:", token);

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
    window: 1
  });
  // console.log("2FA Verified:", verified);
  console.log("Token received:", token, typeof token);
console.log("Secret:", user.twoFactorSecret);
console.log("Verified value:", verified, typeof verified);

  if (!verified) {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  const jwtToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  user.password = undefined;

  res.json({ token: jwtToken, user });
};