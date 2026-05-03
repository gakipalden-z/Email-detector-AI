import express from "express";
import {login, register, getAllusers, updateUserStatus, updateUserRole, deleteUser, suspendUser} from "../controller/auth.js"
// import { verify2FA } from "../controller/2fa.js";
import { verify2FA, verifyLogin2FA } from "../controller/verify2fa.js";
import { verifyToken } from "../middleware/auth.js";
import { setup2FA } from "../config/qr.js";



const userRoutes = express.Router();
// const {  verify2FA, verifyLogin2FA } = require("../controller/verify2fa");
// import { verifyToken } from "../middleware/auth.js";
// import { setup2FA } from "../config/qr.js";

// user register
userRoutes.post("/register", register)


// user login
userRoutes.post("/login", login)
userRoutes.get("/all", getAllusers)
userRoutes.put("/status/:id", updateUserStatus)
userRoutes.put("/role/:id", updateUserRole)
userRoutes.delete("/delete/:id", deleteUser)
userRoutes.put("/suspend/:id", suspendUser)
// userRoutes.post("/2fa/verify", verify2FA);

// SETUP 2FA (user must be logged in)
userRoutes.post("/2fa/setup", verifyToken, setup2FA);

// ENABLE 2FA
userRoutes.post("/2fa/verify", verifyToken, verify2FA);

// LOGIN STEP 2
userRoutes.post("/2fa/login", verifyLogin2FA);

export { userRoutes };