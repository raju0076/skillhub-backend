import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Review } from "../models/review.model.js";
import { redisClient } from "../utils/redis.js";
import { Instructor } from "../models/instructors.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

export const getInstructorDashboard = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const cacheKey = `instructor:${instructorId}:dashboard`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        fromCache: true,
        data: JSON.parse(cachedData)
      });
    }

    const courses = await Course.find({ instructor: instructorId }).select("title price category");

    const enrollments = await Enrollment.aggregate([
      { $match: { courseId: { $in: courses.map(c => c._id) } } },
      { $group: { _id: "$courseId", totalStudents: { $sum: 1 } } }
    ]);

    const reviews = await Review.aggregate([
      { $match: { courseId: { $in: courses.map(c => c._id) } } },
      { $group: { _id: "$courseId", avgRating: { $avg: "$rating" } } }
    ]);

    const dashboardData = courses.map(course => {
      const enrolled = enrollments.find(e => e._id.equals(course._id))?.totalStudents || 0;
      const avgRating = reviews.find(r => r._id.equals(course._id))?.avgRating || 0;
      return { ...course.toObject(), enrolled, avgRating };
    });

    await redisClient.setEx(cacheKey, 600, JSON.stringify(dashboardData));

    res.status(200).json({
      success: true,
      fromCache: false,
      data: dashboardData
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export const createInstructorProfile = async (req, res) => {
  try {
    const {userId,name,email,bio,profileImage,experienceYears,socialLinks} = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if Instructor profile already exists
    const existing = await Instructor.findOne({ userId });
    if (existing) {
      return res.status(400).json({ message: "Instructor profile already exists" });
    }

    const instructor = new Instructor({
      userId,
      name,
      email,
      bio,
      profileImage,
      experienceYears,
      socialLinks
    });

    await instructor.save();

    res.status(201).json({
      message: "Instructor profile created",
      instructor
    });

  } catch (err) {
    console.error("Create instructor profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
