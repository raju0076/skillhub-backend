import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getEnrolledCourses,
  enrollInCourse,
  updateCourseProgress,
  getStudentAnalytics
} from "../controllers/student.controller.js";

const router = express.Router();

router.get("/courses", authMiddleware, getEnrolledCourses);

router.post("/enroll/:courseId", authMiddleware, enrollInCourse);

router.patch("/courses/:courseId/progress", authMiddleware, updateCourseProgress);

router.get("/analytics", authMiddleware, getStudentAnalytics);

export default router;
