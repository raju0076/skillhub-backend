import express from "express";
import { getCourse, enrollCourse, searchCourse, createCourse, getAllCourses } from "../controllers/course.controller.js";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middleware.js";

const courseRoutes = express.Router();

courseRoutes.get("/search", searchCourse);
courseRoutes.get("/getAll", getAllCourses); 
courseRoutes.get("/:courseId", authMiddleware, getCourse);
courseRoutes.post("/:courseId/enroll", authMiddleware, enrollCourse);

courseRoutes.post("/create", authMiddleware, authorizeRoles("admin"), createCourse);

export default courseRoutes;
