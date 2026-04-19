import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import { connectDB } from './config/db.js';
import {routes} from "./routes/routes.js"
import {userRoutes } from "./routes/user.js"

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/models", routes);

app.use("/api/users", userRoutes)

const PORT = process.env.PORT || 5000;
// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});