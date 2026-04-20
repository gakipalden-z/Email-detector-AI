// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {type: String},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["user", "admin", "researcher"], 
    default: "user" 
  }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);