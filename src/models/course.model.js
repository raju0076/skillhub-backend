import mongoose from "mongoose";
const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    title: { type: String, required: true, text: true },
    slug: { type: String, index: true }, 
    description: { type: String },
    thumbnail: { type: String },
    instructorId: { type: Schema.Types.ObjectId, ref: "Instructor", required: true, index: true },
    instructorName: { type: String }, 
    price: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    category: { type: String, index: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], index: true },
    tags: [{ type: String, index: true }],
    metadata: {
      language: { type: String, default: "en" },
      estimatedHours: { type: Number, default: 0 }
    },
    stats: {
      totalEnrollments: { type: Number, default: 0, index: true },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 }, // percent
      averageDuration: { type: Number, default: 0 } // hours
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Text + field indexes for search & filtering
courseSchema.index({ title: "text", description: "text", tags: 1 });
courseSchema.index({ instructorId: 1 });
courseSchema.index({ "stats.totalEnrollments": -1 });

// helper to update instructorName on save if instructor object known
courseSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Course =  mongoose.model("Course", courseSchema);
