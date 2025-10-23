import mongoose from "mongoose";
const { Schema } = mongoose;

const instructorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    name: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    bio: { type: String },
    profileImage: { type: String },

   

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

// Indexes
instructorSchema.index({ isVerified: 1 });
instructorSchema.index({ "stats.totalStudents": -1 });

// Optional: auto-update specializationText before saving
instructorSchema.pre("save", function (next) {
  if (this.specialization && Array.isArray(this.specialization)) {
    this.specializationText = this.specialization.join(", ");
  }
  next();
});

export const Instructor = mongoose.model("Instructor", instructorSchema);
