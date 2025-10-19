import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getPlatformAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

// Admin only
router.get("/platform", authMiddleware, getPlatformAnalytics);

export default router;
