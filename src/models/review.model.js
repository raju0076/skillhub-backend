// src/models/review.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    helpfulCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// enable quick pagination by newest reviews per course
reviewSchema.index({ courseId: 1, createdAt: -1 });

// ensure one review per user per course (optional)
reviewSchema.index({ courseId: 1, userId: 1 }, { unique: false });

/**
 * We WILL update Course.stats.averageRating & totalReviews when reviews change.
 * Prefer doing that inside controllers or with change streams to avoid heavy post-save hooks.
 */

export const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
