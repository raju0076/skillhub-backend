import express from "express";
import { getCourse, enrollCourse, searchCourse } from "../controllers/course.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const courseRoutes = express.Router();

courseRoutes.get("/search", searchCourse);
courseRoutes.get("/:courseId", authMiddleware, getCourse);
courseRoutes.post("/:courseId/enroll", authMiddleware, enrollCourse);

export default courseRoutes;
