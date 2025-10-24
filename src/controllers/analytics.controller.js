import { getInstructorPerformance, getPlatformOverviewLast30Days, getStudentAnalytics } from "../aggregations/aggregations.js";

export const instructorAnalytics = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const data = await getInstructorPerformance(instructorId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
    console.log(err)
  }
};

export const studentAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await getStudentAnalytics(userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const platformOverview = async (req, res) => {
  try {
    const data = await getPlatformOverviewLast30Days();
    res.json({ success: true, data });
  } catch (err) {
    console.error("Platform overview error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
