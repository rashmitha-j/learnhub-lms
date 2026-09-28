import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { COURSE_SORTS, ROLES } from '../utils/constants.js';
import { containsRegex, pick, queryString } from '../utils/helpers.js';
import { buildPagination, parsePagination } from '../utils/pagination.js';
import {
  assertContentAccess,
  findCourseOrThrow,
  getManagedCourse,
  isCourseManager,
} from '../services/accessService.js';
import { attachCourseStats, buildCurriculum, deleteCourseCascade } from '../services/courseService.js';

const EDITABLE_FIELDS = [
  'title',
  'description',
  'category',
  'level',
  'thumbnail',
  'requirements',
  'learningOutcomes',
];

// GET /api/courses — public catalog (published courses only)
export const listCourses = async (req, res) => {
  const pagination = parsePagination(req.query, { defaultLimit: 12 });
  const search = queryString(req.query.search);
  const filter = { published: true };

  if (search) {
    const rx = containsRegex(search);
    filter.$or = [{ title: rx }, { description: rx }];
  }
  if (queryString(req.query.category)) filter.category = req.query.category;
  if (queryString(req.query.level)) filter.level = req.query.level;
  if (queryString(req.query.instructor)) filter.instructor = req.query.instructor;

  const sort = COURSE_SORTS[queryString(req.query.sort)] || COURSE_SORTS.newest;

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('instructor', 'name')
      .lean(),
    Course.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: {
      courses: await attachCourseStats(courses),
      pagination: buildPagination(pagination, total),
    },
  });
};

// GET /api/courses/:id — public details and curriculum preview (no lesson content)
export const getCourse = async (req, res) => {
  const course = await Course.findById(req.params.id).populate('instructor', 'name bio').lean();
  const canManage = course ? isCourseManager(course, req.user) : false;

  // Drafts are only visible to their owner and admins
  if (!course || (!course.published && !canManage)) {
    throw ApiError.notFound('Course not found');
  }

  const [[withStats], curriculum, enrollment] = await Promise.all([
    attachCourseStats([course]),
    buildCurriculum(course._id),
    req.user?.role === ROLES.STUDENT
      ? Enrollment.findOne({ student: req.user._id, course: course._id })
          .select('progress completed enrolledAt')
          .lean()
      : null,
  ]);

  sendSuccess(res, { data: { course: withStats, curriculum, enrollment, canManage } });
};

// GET /api/courses/:id/content — full curriculum for enrolled students and course managers
export const getCourseContent = async (req, res) => {
  const course = await findCourseOrThrow(req.params.id);
  const { canManage, enrollment } = await assertContentAccess(course, req.user);

  await course.populate('instructor', 'name');
  const curriculum = await buildCurriculum(course._id, { includeContent: true });

  sendSuccess(res, { data: { course, curriculum, enrollment, canManage } });
};

// POST /api/courses — new courses always start as drafts
export const createCourse = async (req, res) => {
  const course = await Course.create({
    ...pick(req.body, EDITABLE_FIELDS),
    instructor: req.user._id,
    published: false,
  });

  sendSuccess(res, { statusCode: 201, message: 'Course created', data: { course } });
};

// PUT /api/courses/:id
export const updateCourse = async (req, res) => {
  const course = await getManagedCourse(req.params.id, req.user);
  Object.assign(course, pick(req.body, EDITABLE_FIELDS));

  if (typeof req.body.published === 'boolean' && req.body.published !== course.published) {
    if (req.body.published) {
      const lessonCount = await Lesson.countDocuments({ course: course._id });
      if (lessonCount === 0) {
        throw ApiError.badRequest('Add at least one lesson before publishing this course');
      }
      course.publishedAt = new Date();
    }
    course.published = req.body.published;
  }

  await course.save();
  sendSuccess(res, { message: 'Course updated', data: { course } });
};

// DELETE /api/courses/:id — removes the course with its curriculum, enrollments and attempts
export const deleteCourse = async (req, res) => {
  const course = await getManagedCourse(req.params.id, req.user);
  await deleteCourseCascade(course._id);
  sendSuccess(res, { message: 'Course deleted' });
};

// GET /api/courses/:courseId/students — enrollments for a course (owner/admin)
export const getCourseStudents = async (req, res) => {
  const course = await getManagedCourse(req.params.courseId, req.user);

  const [enrollments, totalLessons] = await Promise.all([
    Enrollment.find({ course: course._id })
      .sort({ enrolledAt: -1 })
      .populate('student', 'name email')
      .select('-completedLessons')
      .lean(),
    Lesson.countDocuments({ course: course._id }),
  ]);

  sendSuccess(res, {
    data: {
      course: { _id: course._id, title: course.title, published: course.published },
      totalLessons,
      enrollments: enrollments.filter((e) => e.student),
    },
  });
};

// GET /api/courses/:courseId/quiz-attempts — quiz results across a course (owner/admin)
export const getCourseQuizAttempts = async (req, res) => {
  const course = await getManagedCourse(req.params.courseId, req.user);

  const attempts = await QuizAttempt.find({ course: course._id })
    .sort({ submittedAt: -1 })
    .limit(200)
    .select('-answers')
    .populate('student', 'name email')
    .populate('quiz', 'title passingScore')
    .lean();

  sendSuccess(res, { data: { attempts } });
};
