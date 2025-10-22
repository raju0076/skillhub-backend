import express from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware.js";
import { createInstructorProfile, getInstructorDashboard } from "../controllers/instructor.controller.js";

const InstructorRoutes = express.Router();

InstructorRoutes.post("/create", authMiddleware, authorizeRoles("instructor"), createInstructorProfile);

InstructorRoutes.get("/:instructorId/dashboard", authMiddleware, getInstructorDashboard);

export default InstructorRoutes;
