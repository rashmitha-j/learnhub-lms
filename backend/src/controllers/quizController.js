import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Section from '../models/Section.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ROLES } from '../utils/constants.js';
import { pick } from '../utils/helpers.js';
import {
  assertContentAccess,
  findCourseOrThrow,
  getManagedCourse,
  isCourseManager,
} from '../services/accessService.js';
import { gradeSubmission, normalizeQuestions, toStudentQuiz } from '../services/quizService.js';

const findQuizOrThrow = async (id) => {
  const quiz = await Quiz.findById(id);
  if (!quiz) throw ApiError.notFound('Quiz not found');
  return quiz;
};

// A quiz may only reference a section of the same course.
const resolveSection = async (sectionId, courseId) => {
  if (!sectionId) return null;
  const section = await Section.findOne({ _id: sectionId, course: courseId }).select('_id').lean();
  if (!section) throw ApiError.badRequest('Section does not belong to this course');
  return section._id;
};

// POST /api/courses/:courseId/quizzes
export const createQuiz = async (req, res) => {
  const course = await getManagedCourse(req.params.courseId, req.user);

  const quiz = await Quiz.create({
    ...pick(req.body, ['title', 'description', 'passingScore']),
    course: course._id,
    section: await resolveSection(req.body.section, course._id),
    questions: normalizeQuestions(req.body.questions),
  });

  sendSuccess(res, { statusCode: 201, message: 'Quiz created', data: { quiz } });
};

// GET /api/quizzes/:id — managers get answers; enrolled students get a sanitized copy
export const getQuiz = async (req, res) => {
  const quiz = await findQuizOrThrow(req.params.id);
  const course = await findCourseOrThrow(quiz.course);
  const { canManage } = await assertContentAccess(course, req.user);

  const courseInfo = { _id: course._id, title: course.title };

  if (canManage) {
    return sendSuccess(res, { data: { quiz, course: courseInfo, canManage: true } });
  }

  const attemptCount = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user._id });
  sendSuccess(res, {
    data: { quiz: toStudentQuiz(quiz), course: courseInfo, canManage: false, attemptCount },
  });
};

// PUT /api/quizzes/:id — questions, when sent, replace the full question list
export const updateQuiz = async (req, res) => {
  const quiz = await findQuizOrThrow(req.params.id);
  await getManagedCourse(quiz.course, req.user);

  Object.assign(quiz, pick(req.body, ['title', 'description', 'passingScore']));
  if (req.body.section !== undefined) {
    quiz.section = await resolveSection(req.body.section, quiz.course);
  }
  if (req.body.questions !== undefined) {
    quiz.questions = normalizeQuestions(req.body.questions);
  }
  await quiz.save();

  sendSuccess(res, { message: 'Quiz updated', data: { quiz } });
};

// DELETE /api/quizzes/:id — also removes its attempts
export const deleteQuiz = async (req, res) => {
  const quiz = await findQuizOrThrow(req.params.id);
  await getManagedCourse(quiz.course, req.user);

  await Promise.all([QuizAttempt.deleteMany({ quiz: quiz._id }), Quiz.deleteOne({ _id: quiz._id })]);
  sendSuccess(res, { message: 'Quiz deleted' });
};

// POST /api/quizzes/:id/submit — the score is always calculated here, never taken from the client
export const submitQuiz = async (req, res) => {
  const quiz = await findQuizOrThrow(req.params.id);
  const course = await findCourseOrThrow(quiz.course);
  const { enrollment } = await assertContentAccess(course, req.user);
  if (!enrollment) throw ApiError.forbidden('Only enrolled students can submit quizzes');

  const result = gradeSubmission(quiz, req.body.answers);
  const attempt = await QuizAttempt.create({
    ...result,
    student: req.user._id,
    quiz: quiz._id,
    course: quiz.course,
  });

  sendSuccess(res, { statusCode: 201, message: 'Quiz submitted', data: { attempt } });
};

// GET /api/quizzes/:id/results — students see their own attempts; managers see all attempts
export const getQuizResults = async (req, res) => {
  const quiz = await findQuizOrThrow(req.params.id);
  const course = await findCourseOrThrow(quiz.course);
  const canManage = isCourseManager(course, req.user);

  if (!canManage && req.user.role !== ROLES.STUDENT) throw ApiError.forbidden();

  const filter = canManage ? { quiz: quiz._id } : { quiz: quiz._id, student: req.user._id };
  const attempts = await QuizAttempt.find(filter)
    .sort({ submittedAt: -1 })
    .populate('student', 'name email')
    .lean();

  sendSuccess(res, {
    data: {
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        questionCount: quiz.questions.length,
        course: { _id: course._id, title: course.title },
      },
      attempts,
      canManage,
    },
  });
};

// GET /api/quiz-attempts/me — recent attempts for the student dashboard
export const getMyAttempts = async (req, res) => {
  const attempts = await QuizAttempt.find({ student: req.user._id })
    .sort({ submittedAt: -1 })
    .limit(20)
    .select('-answers')
    .populate('quiz', 'title passingScore')
    .populate('course', 'title')
    .lean();

  sendSuccess(res, { data: { attempts: attempts.filter((a) => a.quiz && a.course) } });
};
