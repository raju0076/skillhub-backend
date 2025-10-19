// src/models/enrollment.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const quizScoreSchema = new Schema({
  lessonId: { type: Schema.Types.ObjectId, ref: "Lesson" },
  score: { type: Number, min: 0, max: 100 }
}, { _id: false });

const enrollmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    enrolledAt: { type: Date, default: Date.now, index: true },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    lastAccessed: { type: Date, default: Date.now, index: true },
    completedLessonIds: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    quizScores: [quizScoreSchema],
    certificateIssued: { type: Boolean, default: false },
    totalTimeSpentHours: { type: Number, default: 0 } // aggregate time spent
  },
  { timestamps: true }
);

// unique constraint to enforce idempotent enrollments
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// common lookups: user -> enrollments, course -> enrollments
enrollmentSchema.index({ userId: 1 });
enrollmentSchema.index({ courseId: 1 });

/**
 * When an enrollment is created/deleted, we should update course.stats.totalEnrollments
 * and possibly instructor totalStudents. We'll expose helper functions in services/controllers
 * to do these increment/decrement operations inside transactions.
 */

export const Enrollment = mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
