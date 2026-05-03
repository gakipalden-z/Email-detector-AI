// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {type: String},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected", "suspended"], default: "pending" },
  role: { 
    type: String, 
    enum: ["user", "admin", "researcher"], 
    default: "user" 
  },
   twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  twoFactorSecret: {
    type: String
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;