import express from "express";
import {login, register, getAllusers, updateUserStatus, updateUserRole, deleteUser, suspendUser} from "../controller/auth.js"
import { verify2FA } from "../controller/2fa.js";
const userRoutes = express.Router();

// user register
userRoutes.post("/register", register)


// user login
userRoutes.post("/login", login)
userRoutes.get("/all", getAllusers)
userRoutes.put("/status/:id", updateUserStatus)
userRoutes.put("/role/:id", updateUserRole)
userRoutes.delete("/delete/:id", deleteUser)
userRoutes.put("/suspend/:id", suspendUser)
userRoutes.post("/2fa/verify", verify2FA);

export { userRoutes };