import mongoose from "mongoose";

const { Schema } = mongoose;

const progressSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  completedLessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
  progressPercent: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now }
}, { _id: false });

const deviceInfoSchema = new Schema({
  mobile: { type: Number, default: 0 },
  desktop: { type: Number, default: 0 },
  tablet: { type: Number, default: 0 }
}, { _id: false });

const userSchema = new Schema({
  name: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["student", "instructor", "admin"], default: "student", index: true },
  avatar: { type: String },
  bio: { type: String, maxlength: 500 },
  badges: [{ type: String }],
  totalPoints: { type: Number, default: 0 },

  enrolledCourses: [progressSchema],

  deviceInfo: deviceInfoSchema,

  lastActiveAt: { type: Date, default: Date.now, index: true },

  streakDays: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.index({ role: 1, lastActiveAt: -1 });

userSchema.index({ "enrolledCourses.courseId": 1 });

export const User=mongoose.model("User",userSchema)

