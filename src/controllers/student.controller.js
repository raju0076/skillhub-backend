import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import mongoose from "mongoose";
import { Enrollment } from "../models/enrollment.model.js";

export const getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const enrollments = await Enrollment.find({ userId })
      .populate({
        path: "courseId",
        select: "title description instructorName tags price level"
      })
      .lean();

    const courses = enrollments.map(e => e.courseId);

    res.json({ courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch enrolled courses" });
  }
};

export const enrollInCourse = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    const course = await Course.findById(courseId).session(session);
    const user = await User.findById(userId).session(session);

    if (user.enrolledCourses.some(c => c.courseId.toString() === courseId)) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    user.enrolledCourses.push({ courseId, enrolledAt: new Date(), progress: 0 });
    await user.save({ session });

    course.totalEnrollments = (course.totalEnrollments || 0) + 1;
    await course.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Enrollment successful" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: "Enrollment failed" });
  }
};

export const updateCourseProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    const { progress, completedLessons } = req.body;

    const user = await User.findById(userId);

    const courseProgress = user.enrolledCourses.find(c => c.courseId.toString() === courseId);
    if (!courseProgress) return res.status(404).json({ message: "Course not found" });

    if (progress !== undefined) courseProgress.progress = progress;
    if (completedLessons) courseProgress.completedLessons = completedLessons;
    courseProgress.lastAccessed = new Date();

    await user.save();
    res.json({ message: "Progress updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update progress" });
  }
};


export const getStudentAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;

    const enrollments = await Enrollment.find({ userId })
      .populate({
        path: "courseId",
        select: "title"
      })
      .lean();

    const totalCoursesEnrolled = enrollments.length;

    const coursesCompleted = enrollments.filter(e => e.progressPercent === 100).length;
    const coursesInProgress = enrollments.filter(e => e.progressPercent > 0 && e.progressPercent < 100).length;

    res.json({
      studentId: userId,
      learningStats: {
        totalCoursesEnrolled,
        coursesCompleted,
        coursesInProgress
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};
