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

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);

userRoutes.get("/profile", authMiddleware, getUserProfile);
userRoutes.put("/profile", authMiddleware, updateUserProfile);

userRoutes.get("/:userId/analytics", authMiddleware, getUserLearningAnalytics);

export default userRoutes;
