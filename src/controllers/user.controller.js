import User from "../models/user.model.js"; // Your User schema
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Course from "../models/course.model.js"; // For analytics
import mongoose from "mongoose";

// Helper: Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// ------------------- Register User -------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, passwordHash, role });
    const token = generateToken(user);

    res.status(201).json({ message: "User registered successfully", token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------- Login User -------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------- Get User Profile -------------------
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-passwordHash"); // Exclude password hash
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------- Update User Profile -------------------
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, avatar, bio } = req.body;

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (bio) user.bio = bio;

    await user.save();

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------- Student Learning Analytics -------------------
export const getUserLearningAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;

    // Ensure user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Aggregation: Courses enrolled
    const enrolledCourses = await Course.aggregate([
      { $match: { "students.userId": new mongoose.Types.ObjectId(userId) } },
      { $project: {
          title: 1,
          progress: {
            $first: {
              $map: {
                input: {
                  $filter: {
                    input: "$students",
                    cond: { $eq: ["$$this.userId", new mongoose.Types.ObjectId(userId)] }
                  }
                },
                as: "s",
                in: "$$s.progress"
              }
            }
          },
          lessonsCount: { $size: "$lessons" },
        }
      }
    ]);

    // Placeholder calculations
    const totalCoursesEnrolled = enrolledCourses.length;
    const coursesCompleted = enrolledCourses.filter(c => c.progress >= 100).length;
    const coursesInProgress = enrolledCourses.filter(c => c.progress > 0 && c.progress < 100).length;

    // TODO: Add streaks, averageQuizScore, strong/weak categories, recommendations

    res.json({
      studentId: user._id,
      learningStats: {
        totalCoursesEnrolled,
        coursesCompleted,
        coursesInProgress,
      },
      performanceMetrics: {
        averageQuizScore: null,
        strongCategories: [],
        weakCategories: [],
        improvementRate: null
      },
      recommendations: []
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
