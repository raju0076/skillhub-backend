import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getInstructorDashboard } from "../controllers/instructor.controller.js";

const router = express.Router();

// Protected: Only instructor/admin
router.get("/:instructorId/dashboard", authMiddleware, getInstructorDashboard);

export default router;
