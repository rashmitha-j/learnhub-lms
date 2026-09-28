import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ALL_ROLES } from '../utils/constants.js';
import { containsRegex, queryString } from '../utils/helpers.js';
import { buildPagination, parsePagination } from '../utils/pagination.js';
import { attachCourseStats } from '../services/courseService.js';

// GET /api/admin/stats — simple platform counts
export const getStats = async (req, res) => {
  const [roleCounts, totalCourses, publishedCourses, totalEnrollments, completedEnrollments, quizAttempts] =
    await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Course.countDocuments(),
      Course.countDocuments({ published: true }),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ completed: true }),
      QuizAttempt.countDocuments(),
    ]);

  const users = Object.fromEntries(ALL_ROLES.map((role) => [role, 0]));
  for (const row of roleCounts) users[row._id] = row.count;

  sendSuccess(res, {
    data: {
      stats: {
        users,
        totalUsers: Object.values(users).reduce((a, b) => a + b, 0),
        totalCourses,
        publishedCourses,
        draftCourses: totalCourses - publishedCourses,
        totalEnrollments,
        completedEnrollments,
        quizAttempts,
      },
    },
  });
};

// GET /api/admin/users?search=&role=&page=
export const listUsers = async (req, res) => {
  const pagination = parsePagination(req.query, { defaultLimit: 20 });
  const filter = {};
  const search = queryString(req.query.search);
  const role = queryString(req.query.role);

  if (search) {
    const rx = containsRegex(search);
    filter.$or = [{ name: rx }, { email: rx }];
  }
  if (role && ALL_ROLES.includes(role)) filter.role = role;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, { data: { users, pagination: buildPagination(pagination, total) } });
};

// GET /api/admin/courses?search=&status=&page= — includes drafts
export const listCourses = async (req, res) => {
  const pagination = parsePagination(req.query, { defaultLimit: 20 });
  const filter = {};
  const search = queryString(req.query.search);
  const status = queryString(req.query.status);

  if (search) filter.title = containsRegex(search);
  if (status) filter.published = status === 'published';

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('instructor', 'name email')
      .lean(),
    Course.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: { courses: await attachCourseStats(courses), pagination: buildPagination(pagination, total) },
  });
};

// GET /api/admin/enrollments?page=
export const listEnrollments = async (req, res) => {
  const pagination = parsePagination(req.query, { defaultLimit: 20 });

  const [enrollments, total] = await Promise.all([
    Enrollment.find()
      .sort({ enrolledAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .select('-completedLessons')
      .populate('student', 'name email')
      .populate('course', 'title')
      .lean(),
    Enrollment.countDocuments(),
  ]);

  sendSuccess(res, { data: { enrollments, pagination: buildPagination(pagination, total) } });
};
