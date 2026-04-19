import express from "express";
import {login, register} from "../controller/auth.js"
const userRoutes = express.Router();

// user register
userRoutes.post("/register", register)


// user login
userRoutes.post("/login", login)

export { userRoutes };