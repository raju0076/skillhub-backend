import express from "express";
import {
  instructorAnalytics,
  studentAnalytics,
  platformOverview
} from "../controllers/analytics.controller.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ✅ Instructor performance analytics
router.get("/instructor/:instructorId", authMiddleware, instructorAnalytics);

// ✅ Student analytics
router.get("/student/:userId", authMiddleware, studentAnalytics);

// ✅ Platform overview (admin only)
router.get("/platform/overview", adminMiddleware, platformOverview);

export default router;
