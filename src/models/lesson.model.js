// src/models/lesson.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const lessonSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true },
    content: { type: String }, // small text or markdown
    videoUrl: { type: String },
    durationMinutes: { type: Number, default: 0 },
    order: { type: Number, default: 0, index: true },
    resources: [{ type: String }]
  },
  { timestamps: true }
);

// fetch lessons for a course in order fast
lessonSchema.index({ courseId: 1, order: 1 });

export const Lesson = mongoose.models.Lesson || mongoose.model("Lesson", lessonSchema);
