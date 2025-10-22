import {
  getInstructorPerformance,
  getStudentAnalytics,
  getPlatformOverviewLast30Days
} from "../analytics/aggregations.js"; // adjust path if analytics/ folder differs

// ✅ Instructor analytics
export const instructorAnalytics = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const data = await getInstructorPerformance(instructorId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Student analytics
export const studentAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await getStudentAnalytics(userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Platform overview (last 30 days)
export const platformOverview = async (req, res) => {
  try {
    const data = await getPlatformOverviewLast30Days();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
