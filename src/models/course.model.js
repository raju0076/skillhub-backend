import mongoose from "mongoose";
const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    title: { type: String, required: true, text: true },
    slug: { type: String, index: true },
    description: { type: String },
    thumbnail: { type: String },
    instructorId: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
    instructorName: { type: String },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    category: { type: String, index: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], index: true },
    // tags: [{ type: String, index: true }],
    metadata: {
      language: { type: String, default: "en" },
      estimatedHours: { type: Number, default: 0 }
    },
    stats: {
      totalEnrollments: { type: Number, default: 0, index: true },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      averageDuration: { type: Number, default: 0 }
    },
  },
  { timestamps: true }
);

courseSchema.index({ title: "text", description: "text" });
courseSchema.index({ "stats.totalEnrollments": -1 });

courseSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Course = mongoose.model("Course", courseSchema);
