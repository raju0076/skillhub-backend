import express from "express";
import { getCourse, enrollCourse, searchCourse, createCourse } from "../controllers/course.controller.js";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware.js";

const courseRoutes = express.Router();

courseRoutes.get("/search", searchCourse);

courseRoutes.get("/:courseId", authMiddleware, getCourse);
courseRoutes.post("/:courseId/enroll", authMiddleware, enrollCourse);

courseRoutes.post("/create", authMiddleware, authorizeRoles("admin"), createCourse);

export default courseRoutes;
