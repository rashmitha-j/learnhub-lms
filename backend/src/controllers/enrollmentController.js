import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { sameId } from '../utils/helpers.js';
import { completeLesson as markLessonComplete, countLessonsByCourse } from '../services/progressService.js';

// POST /api/courses/:courseId/enroll
export const enroll = async (req, res) => {
  const course = await Course.findById(req.params.courseId).select('published').lean();

  // Drafts are hidden, so they behave like missing courses
  if (!course || !course.published) throw ApiError.notFound('Course not found');

  if (await Enrollment.exists({ student: req.user._id, course: course._id })) {
    throw ApiError.conflict('You are already enrolled in this course');
  }

  // The unique index also protects against concurrent duplicate requests
  const enrollment = await Enrollment.create({ student: req.user._id, course: course._id });

  sendSuccess(res, { statusCode: 201, message: 'Enrolled successfully', data: { enrollment } });
};

// GET /api/enrollments/me
export const getMyEnrollments = async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .sort({ updatedAt: -1 })
    .populate({
      path: 'course',
      select: 'title thumbnail category level published instructor',
      populate: { path: 'instructor', select: 'name' },
    })
    .lean();

  const valid = enrollments.filter((e) => e.course);
  const lessonCounts = await countLessonsByCourse(valid.map((e) => e.course._id));

  sendSuccess(res, {
    data: {
      enrollments: valid.map((e) => ({
        ...e,
        completedCount: e.completedLessons.length,
        totalLessons: lessonCounts.get(e.course._id.toString()) ?? 0,
      })),
    },
  });
};

// GET /api/enrollments/:courseId — the current student's enrollment in one course
export const getEnrollment = async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  }).lean();
  if (!enrollment) throw ApiError.notFound('You are not enrolled in this course');

  const totalLessons = await Lesson.countDocuments({ course: enrollment.course });

  sendSuccess(res, {
    data: { enrollment: { ...enrollment, completedCount: enrollment.completedLessons.length, totalLessons } },
  });
};

// POST /api/enrollments/:courseId/lessons/:lessonId/complete
export const completeLesson = async (req, res) => {
  const { courseId, lessonId } = req.params;

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (!enrollment) throw ApiError.forbidden('You must be enrolled in this course');

  const lesson = await Lesson.findById(lessonId).select('course').lean();
  if (!lesson || !sameId(lesson.course, courseId)) {
    throw ApiError.notFound('Lesson not found in this course');
  }

  const result = await markLessonComplete(enrollment, lesson._id);

  sendSuccess(res, {
    message: result.alreadyCompleted ? 'Lesson was already completed' : 'Lesson marked as complete',
    data: {
      enrollment: {
        ...result.enrollment,
        completedCount: result.enrollment.completedLessons.length,
        totalLessons: result.totalLessons,
      },
      alreadyCompleted: result.alreadyCompleted,
    },
  });
};
