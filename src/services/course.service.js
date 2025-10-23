// src/services/course.service.js
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Review } from "../models/review.model.js";
import { redisClient } from "../utils/redis.js";
import mongoose from "mongoose";


export const getCourseDetails = async (courseId, userId, limit = 10, cursor = null) => {
  const cacheKey = `course:${courseId}:user:${userId}:cursor:${cursor || "first"}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 1️⃣ Fetch course and instructor
  const course = await Course.findById(courseId)
    .select("-__v")
    .lean();

  if (!course) throw new Error("Course not found");

  // 2️⃣ Get reviews with cursor-based pagination
  const reviewQuery = { courseId: mongoose.Types.ObjectId(courseId) };
  if (cursor) reviewQuery._id = { $gt: mongoose.Types.ObjectId(cursor) };

  const reviews = await Review.find(reviewQuery)
    .sort({ _id: 1 })
    .limit(limit)
    .select("userId rating comment helpfulCount createdAt")
    .lean();

  const nextCursor = reviews.length === limit ? reviews[reviews.length - 1]._id : null;

  // 3️⃣ Enrollment stats
  const totalEnrollments = await Enrollment.countDocuments({ courseId });
  const isEnrolled = userId ? await Enrollment.exists({ courseId, userId }) : false;

  const userProgressDoc = userId ? await Enrollment.findOne({ courseId, userId }).select("progressPercent").lean() : null;

  const response = {
    course: {
      ...course,
      stats: {
        totalEnrollments,
        averageRating: course.stats.averageRating,
        totalReviews: course.stats.totalReviews,
        completionRate: course.stats.completionRate,
        averageDuration: course.stats.averageDuration
      },
      pricing: { amount: course.price, currency: course.currency },
    },
    reviews: {
      items: reviews,
      pagination: { nextCursor, hasMore: !!nextCursor, total: course.stats.totalReviews }
    },
    isEnrolled: !!isEnrolled,
    userProgress: userProgressDoc?.progressPercent || null
  };

  // 4️⃣ Cache response
  await redisClient.setex(cacheKey, 60, JSON.stringify(response)); // cache 1 min

  return response;
};


export const enrollInCourse = async (courseId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Prevent duplicate enrollment
    const existing = await Enrollment.findOne({ courseId, userId }).session(session);
    if (existing) {
      await session.commitTransaction();
      return { alreadyEnrolled: true };
    }

    // Create enrollment
    const enrollment = await Enrollment.create(
      [{ courseId, userId }],
      { session }
    );

    // Increment course.totalEnrollments & instructor.totalStudents
    await Course.updateOne({ _id: courseId }, { $inc: { "stats.totalEnrollments": 1 } }).session(session);

    const course = await Course.findById(courseId).session(session);
    await Instructor.updateOne({ _id: course.instructorId }, { $inc: { "stats.totalStudents": 1 } }).session(session);

    await session.commitTransaction();

    // Invalidate relevant caches
    await redisClient.del(`course:${courseId}:*`);

    return { alreadyEnrolled: false, enrollment };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};


export const searchCourses = async ({ q, category, rating, level, page = 1, limit = 20, sort = "popularity" }) => {
  const filter = {};
  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (level) filter.level = level;
  if (rating) filter["stats.averageRating"] = { $gte: rating };

  let sortObj = {};
  switch (sort) {
    case "popularity": sortObj["stats.totalEnrollments"] = -1; break;
    case "rating": sortObj["stats.averageRating"] = -1; break;
    case "newest": sortObj.createdAt = -1; break;
    case "price": sortObj.price = 1; break;
    default: sortObj["stats.totalEnrollments"] = -1;
  }

  const courses = await Course.find(filter)
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .select("title description thumbnail price currency tags stats")
    .lean();

  const total = await Course.countDocuments(filter);

  return { items: courses, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
