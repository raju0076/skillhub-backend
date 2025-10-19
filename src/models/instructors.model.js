import mongoose from "mongoose";
const { Schema } = mongoose;

const instructorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    name: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    bio: { type: String },
    profileImage: { type: String },
    specialization: [{ type: String, index: true }], // e.g. ["Web Development", "AI"]
    experienceYears: { type: Number, default: 0 },
    socialLinks: {
      linkedin: { type: String },
      twitter: { type: String },
      youtube: { type: String },
      website: { type: String },
    },

    stats: {
      totalCourses: { type: Number, default: 0 },
      totalStudents: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },

    isVerified: { type: Boolean, default: false, index: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 🔍 Useful indexes
instructorSchema.index({ name: "text", specialization: 1 });
instructorSchema.index({ isVerified: 1 });
instructorSchema.index({ "stats.totalStudents": -1 });

// 🧩 Hook: auto-update timestamps
instructorSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Instructor =
  mongoose.models.Instructor || mongoose.model("Instructor", instructorSchema);
