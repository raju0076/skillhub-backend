import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserLearningAnalytics
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const userRoutes = express.Router();

// Public
userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);

// Protected
userRoutes.get("/profile", authMiddleware, getUserProfile);
userRoutes.put("/profile", authMiddleware, updateUserProfile);

// Student Analytics
userRoutes.get("/:userId/analytics", authMiddleware, getUserLearningAnalytics);

export default userRoutes;
