import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getEnrolledCourses,
  enrollInCourse,
  updateCourseProgress,
  getStudentAnalytics
} from "../controllers/student.controller.js";

const studentRoutes = express.Router();

studentRoutes.get("/getEnrolledcourses", authMiddleware, getEnrolledCourses);

// studentRoutes.post("/enroll/:courseId", authMiddleware, enrollInCourse);

studentRoutes.patch("/courses/:courseId/progress", authMiddleware, updateCourseProgress);

studentRoutes.get("/analytics", authMiddleware, getStudentAnalytics);

export default studentRoutes;
