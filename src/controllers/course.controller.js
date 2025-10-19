// src/controllers/course.controller.js
import { getCourseDetails, enrollInCourse, searchCourses } from "../services/course.service.js";

export const getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id;
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
    const userId = req.user._id;

    const result = await enrollInCourse(courseId, userId);
    res.json(result);
  } catch (err) {
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
};
