import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { containsRegex, queryString } from '../utils/helpers.js';
import { attachCourseStats } from '../services/courseService.js';

// GET /api/instructor/courses — the instructor's own courses, including drafts
export const getMyCourses = async (req, res) => {
  const filter = { instructor: req.user._id };
  const status = queryString(req.query.status);
  const search = queryString(req.query.search);

  if (status) filter.published = status === 'published';
  if (search) filter.title = containsRegex(search);

  const courses = await Course.find(filter).sort({ updatedAt: -1 }).lean();
  sendSuccess(res, { data: { courses: await attachCourseStats(courses) } });
};

// GET /api/instructor/dashboard
export const getDashboard = async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id })
    .sort({ updatedAt: -1 })
    .select('title published thumbnail category updatedAt')
    .lean();
  const courseIds = courses.map((c) => c._id);

  const [students, totalEnrollments, completedEnrollments, recentEnrollments, coursesWithStats] =
    await Promise.all([
      Enrollment.distinct('student', { course: { $in: courseIds } }),
      Enrollment.countDocuments({ course: { $in: courseIds } }),
      Enrollment.countDocuments({ course: { $in: courseIds }, completed: true }),
      Enrollment.find({ course: { $in: courseIds } })
        .sort({ enrolledAt: -1 })
        .limit(8)
        .select('student course enrolledAt progress completed')
        .populate('student', 'name email')
        .populate('course', 'title')
        .lean(),
      attachCourseStats(courses.slice(0, 5)),
    ]);

  const published = courses.filter((c) => c.published).length;

  sendSuccess(res, {
    data: {
      stats: {
        totalCourses: courses.length,
        publishedCourses: published,
        draftCourses: courses.length - published,
        totalStudents: students.length,
        totalEnrollments,
        completedEnrollments,
      },
      recentCourses: coursesWithStats,
      recentEnrollments: recentEnrollments.filter((e) => e.student && e.course),
    },
  });
};
