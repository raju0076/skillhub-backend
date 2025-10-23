// aggregations.js
import mongoose from "mongoose";
import { Course, Enrollment, Review, Instructor } from "./models"; // adjust paths

export async function getInstructorPerformance(instructorId) {
  const instrOid = mongoose.Types.ObjectId(instructorId);
  // 1) Pre-aggregate enrollments per course (fast, uses index on courseId)
  const enrollAgg = await Enrollment.aggregate([
    // match only courses belonging to instructor later via $lookup, but better: match by courseIds
    { $match: { } }, // keep empty; below we will join by course
    { $group: {
        _id: "$courseId",
        totalEnrollments: { $sum: 1 },
        activeLast30: {
          $sum: {
            $cond: [
              { $gte: ["$lastAccessed", new Date(Date.now() - 30*24*60*60*1000)] },
              1, 0
            ]
          }
        },
        completed80Count: {
          $sum: {
            $cond: [ { $gte: ["$progressPercent", 80] }, 1, 0 ]
          }
        },
        avgProgress: { $avg: "$progressPercent" },
        avgTimeSpent: { $avg: "$totalTimeSpentHours" }
    } },
  ]).allowDiskUse(false);

  // Convert to map for quick lookup in Node (smallish: number of courses per instructor ~50)
  const enrollMap = new Map(enrollAgg.map(e => [String(e._id), e]));

  // 2) Get courses of instructor and attach enroll data + review metrics via pipeline
  const courses = await Course.aggregate([
    { $match: { instructorId: instrOid } },
    { $project: {
        title: 1, price: 1, _id: 1,
        stats: 1
    }},
    // Lookup computed reviews summary
    { $lookup: {
        from: "reviews",
        let: { courseId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$courseId", "$$courseId"] } } },
          { $group: { _id: null, avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
        ],
        as: "revSummary"
    }},
    { $unwind: { path: "$revSummary", preserveNullAndEmptyArrays: true } },
    { $addFields: {
       avgRating: { $ifNull: ["$revSummary.avgRating", "$stats.averageRating"] },
       totalReviews: { $ifNull: ["$revSummary.totalReviews", "$stats.totalReviews"] }
    }},
    { $project: { revSummary: 0 } }
  ]).allowDiskUse(false);

  // 3) Compose final result in Node to avoid large $lookup/unwind cost
  let totalCourses = courses.length;
  let totalStudents = 0, totalRevenue = 0, ratingsSum = 0, ratingCount = 0;
  const courseBreakdown = courses.map(c => {
    const enrollData = enrollMap.get(String(c._id)) || {
      totalEnrollments: c.stats?.totalEnrollments || 0,
      completed80Count: 0,
      avgProgress: c.stats?.averageProgress || 0,
      avgTimeSpent: c.stats?.averageDuration || 0,
      activeLast30: 0
    };
    totalStudents += enrollData.totalEnrollments;
    totalRevenue += (c.price || 0) * enrollData.totalEnrollments;
    if (c.avgRating != null) { ratingsSum += c.avgRating; ratingCount++; }

    return {
      courseName: c.title,
      enrollments: enrollData.totalEnrollments,
      completionRate: enrollData.totalEnrollments ? (enrollData.completed80Count / enrollData.totalEnrollments) : 0,
      averageProgress: enrollData.avgProgress || 0,
      rating: c.avgRating || 0,
      revenue: (c.price || 0) * enrollData.totalEnrollments,
      activeLast30: enrollData.activeLast30
    };
  });

  const averageRating = ratingCount ? ratingsSum / ratingCount : 0;

  // Student engagement across all courses for this instructor
  const activeStudents = Array.from(enrollMap.values()).reduce((acc, v) => acc + (v.activeLast30 || 0), 0);
  const inactiveStudents = totalStudents - activeStudents;
  const averageTimeSpent = courses.length ? (Array.from(enrollMap.values()).reduce((a,b)=>a+(b.avgTimeSpent||0),0)/courses.length) : 0;

  // Trending: topPerforming by enrollments, fastestGrowing by enrollments in last 30 days
  courseBreakdown.sort((a,b)=>b.enrollments - a.enrollments);
  const topPerformingCourse = courseBreakdown[0]?.courseName || null;
  // fastest growing requires enrollments by month — approximate by activeLast30
  courseBreakdown.sort((a,b)=>b.activeLast30 - a.activeLast30);
  const fastestGrowingCourse = courseBreakdown[0]?.courseName || null;

  return {
    instructorId: instrOid,
    totalCourses,
    totalStudents,
    averageRating,
    totalRevenue,
    courseBreakdown,
    studentEngagement: {
      activeStudents,
      inactiveStudents,
      averageTimeSpent
    },
    trending: {
      topPerformingCourse,
      fastestGrowingCourse
    }
  };
}


export async function getStudentAnalytics(userId) {
  const uid = mongoose.Types.ObjectId(userId);
  const enrolls = await Enrollment.find({ userId: uid }).lean();

  const totalCoursesEnrolled = enrolls.length;
  const now = Date.now();
  const sixtyDays = 60*24*60*60*1000;

  let coursesCompleted = 0, coursesInProgress = 0, coursesAbandoned = 0;
  let totalDaysToComplete = 0, completedCountForAvg = 0;
  let totalHoursLearned = 0;
  let quizScores = []; 

  for (const e of enrolls) {
    if ((e.progressPercent || 0) >= 80) { coursesCompleted++; }
    else if ( (now - new Date(e.lastAccessed || e.enrolledAt).getTime()) > sixtyDays ) { coursesAbandoned++; }
    else { coursesInProgress++; }

    if (e.progressPercent >= 80 && e.enrolledAt && e.lastAccessed) {
      totalDaysToComplete += (new Date(e.lastAccessed).getTime() - new Date(e.enrolledAt).getTime()) / (1000*3600*24);
      completedCountForAvg++;
    }
    totalHoursLearned += (e.totalTimeSpentHours || 0);

    if (e.quizScores && e.quizScores.length) {
      const course = await Course.findById(e.courseId).select("tags category level").lean();
      const avgScore = e.quizScores.reduce((a,b)=>a+b.score,0) / e.quizScores.length;
      quizScores.push({ courseId: e.courseId, tags: course?.tags || [], score: avgScore, category: course?.category, level: course?.level });
    }
  }

  const averageCompletionTime = completedCountForAvg ? (totalDaysToComplete / completedCountForAvg) : 0;
  const totalHours = totalHoursLearned;

  // streakDays: naive approach using enrollments' lastAccessed & activity logs ideally needed
  // For demo: compute consecutive days in last 30 days where lastAccessed exists
  const activityDates = new Set();
  // If you maintain an Activity collection, use that. Here approximate:
  enrolls.forEach(e => {
    if (e.lastAccessed) {
      const d = new Date(e.lastAccessed).toISOString().slice(0,10); // yyyy-mm-dd
      activityDates.add(d);
    }
  });
  // compute longest consecutive streak in last 90 days
  const days = Array.from(activityDates).sort();
  let maxStreak = 0, cur = 0, prev = null;
  for (const d of days) {
    const dt = new Date(d);
    if (prev && ( (dt - prev)/(1000*60*60*24) === 1)) cur++;
    else cur = 1;
    prev = dt;
    if (cur > maxStreak) maxStreak = cur;
  }

  // performance metrics: average quiz score
  const avgQuiz = quizScores.length ? (quizScores.reduce((a,b)=>a+b.score,0) / quizScores.length) : 0;

  // strong/weak categories by score
  const catScores = {};
  quizScores.forEach(q => {
    const cat = q.category || "uncategorized";
    catScores[cat] = catScores[cat] || { total:0, count:0 };
    catScores[cat].total += q.score;
    catScores[cat].count += 1;
  });
  const catAvg = Object.entries(catScores).map(([k,v])=>({ category:k, avg: v.total/v.count }));
  catAvg.sort((a,b)=>b.avg - a.avg);
  const strongCategories = catAvg.slice(0,3).map(x=>x.category);
  const weakCategories = catAvg.slice(-3).map(x=>x.category);

  // improvementRate: naive compare last half vs first half of quiz scores
  // flatten scores by chronology if timestamps available; else approximate
  const improvementRate = 0; // placeholder (needs timestamped quiz attempts)

  // recommendations: simple tag-match score
  const completedTags = {};
  quizScores.forEach(q => q.tags.forEach(t => completedTags[t] = (completedTags[t]||0)+1));
  const tagList = Object.keys(completedTags);
  // find courses that match these tags and user not enrolled
  const recCandidates = await Course.aggregate([
    { $match: { tags: { $in: tagList } } },
    { $project: { title:1, tags:1, price:1, stats:1 } },
    { $limit: 50 }
  ]);

  // compute matchScore simple formula: (#matching tags * avgQuizScoreFactor * level factor)
  const recommendations = recCandidates.map(c => {
    const matchTags = c.tags.filter(t=>tagList.includes(t)).length;
    const matchScore = matchTags * (avgQuiz/100) * (1 + ((c.stats?.averageRating || 4)/5));
    return { courseId: c._id, courseName: c.title, matchScore, reason: `${matchTags} matching tags` };
  }).sort((a,b)=>b.matchScore - a.matchScore).slice(0,10);

  return {
    studentId: uid,
    learningStats: {
      totalCoursesEnrolled,
      coursesCompleted,
      coursesInProgress,
      coursesAbandoned,
      averageCompletionTime,
      totalHoursLearned: totalHours,
      streakDays: maxStreak
    },
    performanceMetrics: {
      averageQuizScore: avgQuiz,
      strongCategories,
      weakCategories,
      improvementRate
    },
    recommendations
  };
}


export async function getPlatformOverviewLast30Days() {
  const now = new Date();
  const start = new Date(now.getTime() - 30*24*60*60*1000);

  // Overview counts
  const [ totalUsers, newUsers, totalCourses, totalEnrollments, totalRevenue ] = await Promise.all([
    // total users
    User.countDocuments({}),
    // new users last 30
    User.countDocuments({ createdAt: { $gte: start } }),
    // total courses
    Course.countDocuments({}),
    // enrollments last 30
    Enrollment.countDocuments({ enrolledAt: { $gte: start } }),
    // revenue: if you have Payments collection; else compute approx via enrollments * course.price (expensive)
    // For demo: compute revenue by joining enrollments->course (aggregation)
    Enrollment.aggregate([
      { $match: { enrolledAt: { $gte: start } } },
      { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
      { $unwind: "$course" },
      { $group: { _id: null, total: { $sum: "$course.price" } } }
    ]).then(r=> r[0]?.total || 0)
  ]);

  const enrollmentsByDay = await Enrollment.aggregate([
    { $match: { enrolledAt: { $gte: start } } },
    { $group: {
       _id: { $dateToString: { format: "%Y-%m-%d", date: "$enrolledAt" } },
       count: { $sum: 1 }
    }},
    { $sort: { "_id": 1 } }
  ]);

  const weekStart = new Date(now.getTime() - 90*24*60*60*1000); // last 90 days
  const completionRateByWeek = await Enrollment.aggregate([
    { $match: { enrolledAt: { $gte: weekStart } } },
    { $project: { week: { $isoWeekYear: "$enrolledAt" }, isCompleted: { $cond: [{ $gte: ["$progressPercent", 80] }, 1, 0] } } },
    // Using ISO week might need extra processing; simpler: group by week number computed in node
  ]);

  // userBehavior: averageCoursesPerUser
  const avgCoursesPerUserAgg = await Enrollment.aggregate([
    { $group: { _id: "$userId", cnt: { $sum: 1 } } },
    { $group: { _id: null, avg: { $avg: "$cnt" } } }
  ]);

  const averageCoursesPerUser = avgCoursesPerUserAgg[0]?.avg || 0;

  // device breakdown from users.deviceInfo aggregate
  const deviceAgg = await User.aggregate([
    { $group: { _id: null, mobile: { $sum: "$deviceInfo.mobile" }, desktop: { $sum: "$deviceInfo.desktop" }, tablet: { $sum: "$deviceInfo.tablet" } } }
  ]);

  const device = deviceAgg[0] || { mobile:0, desktop:0, tablet:0 };

  return {
    period: "last_30_days",
    overview: {
      totalUsers, newUsers, totalRevenue, totalCourses, totalEnrollments
    },
    trends: {
      enrollmentsByDay,
      // revenueByDay we'd compute similarly
      completionRateByWeek
    },
    userBehavior: {
      averageCoursesPerUser,
      deviceBreakdown: device
    }
  };
}
