import express from "express";
import {
  instructorAnalytics,
  studentAnalytics,
  platformOverview
} from "../controllers/analytics.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const analyticRoutes = express.Router();

analyticRoutes.get("/instructor/:instructorId", authMiddleware, instructorAnalytics);

analyticRoutes.get("/student/:userId", authMiddleware, studentAnalytics);

analyticRoutes.get("/platform/overview", authMiddleware, platformOverview);

export default analyticRoutes;
