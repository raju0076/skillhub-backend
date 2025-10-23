import { Course } from "../models/course.model.js";
import { Instructor } from "../models/instructors.model.js";
import { getCourseDetails, enrollInCourse, searchCourses } from "../services/course.service.js";
import mongoose from "mongoose";



export const getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;
    const cursor = req.query.cursor || null;

    const data = await getCourseDetails(courseId, userId, 10, cursor);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;


    const result = await enrollInCourse(courseId, userId);
    res.json(result);
  } catch (err) {
    console.error("Enroll Error:", err); 
    res.status(500).json({ error: err.message });
  }
};


export const searchCourse = async (req, res) => {
  try {
    const { q, category, rating, level, sort, page } = req.query;
    const data = await searchCourses({ q, category, rating, level, sort, page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      level,
      instructorId
    } = req.body;

    if (!title || !instructorId) {
      return res.status(400).json({ message: "Title and instructorId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ message: "Invalid instructorId" });
    }

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    const newCourse = new Course({
      title,
      description: description || "",
      price: price || 0,
      category: category || "General",
      level: level || "beginner",
      instructorId: instructor._id,
      instructorName: instructor.name
    });

    await newCourse.save();

    res.status(201).json({
      message: "Course created successfully",
      course: newCourse
    });
  } catch (err) {
    console.error("Create course error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getAllCourses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; 
    const cursor = req.query.cursor || null;

    let query = {};
    if (cursor) {
      query._id = { $gt: cursor }; 
    }

    const courses = await Course.find(query)
      .sort({ _id: 1 }) 
      .limit(limit);

    const nextCursor = courses.length > 0 ? courses[courses.length - 1]._id : null;

    res.json({
      courses,
      nextCursor,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};