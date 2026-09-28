import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';

// Adds lessonCount, totalDuration and studentCount to lean course objects using two aggregations
// for the whole list (avoids one query per course).
export const attachCourseStats = async (courses) => {
  if (courses.length === 0) return courses;
  const ids = courses.map((course) => course._id);

  const [lessonStats, enrollmentStats] = await Promise.all([
    Lesson.aggregate([
      { $match: { course: { $in: ids } } },
      { $group: { _id: '$course', lessonCount: { $sum: 1 }, totalDuration: { $sum: '$duration' } } },
    ]),
    Enrollment.aggregate([
      { $match: { course: { $in: ids } } },
      { $group: { _id: '$course', studentCount: { $sum: 1 } } },
    ]),
  ]);

  const lessonMap = new Map(lessonStats.map((s) => [s._id.toString(), s]));
  const enrollmentMap = new Map(enrollmentStats.map((s) => [s._id.toString(), s.studentCount]));

  return courses.map((course) => {
    const id = course._id.toString();
    return {
      ...course,
      lessonCount: lessonMap.get(id)?.lessonCount ?? 0,
      totalDuration: lessonMap.get(id)?.totalDuration ?? 0,
      studentCount: enrollmentMap.get(id) ?? 0,
    };
  });
};

const toQuizSummary = (quiz) => ({
  _id: quiz._id,
  title: quiz.title,
  description: quiz.description,
  section: quiz.section,
  passingScore: quiz.passingScore,
  questionCount: quiz.questions.length,
});

// Builds the ordered curriculum: sections -> lessons + quizzes. Public previews omit lesson
// content (video URLs, descriptions). Quiz questions are never included here.
export const buildCurriculum = async (courseId, { includeContent = false } = {}) => {
  const lessonFields = includeContent
    ? 'section title description videoUrl duration order'
    : 'section title duration order';

  const [sections, lessons, quizzes] = await Promise.all([
    Section.find({ course: courseId }).sort({ order: 1, createdAt: 1 }).select('title order').lean(),
    Lesson.find({ course: courseId }).sort({ order: 1, createdAt: 1 }).select(lessonFields).lean(),
    Quiz.find({ course: courseId })
      .sort({ createdAt: 1 })
      .select('title description section passingScore questions')
      .lean(),
  ]);

  const bySection = new Map(sections.map((s) => [s._id.toString(), { ...s, lessons: [], quizzes: [] }]));

  for (const lesson of lessons) {
    bySection.get(lesson.section.toString())?.lessons.push(lesson);
  }

  const courseQuizzes = [];
  for (const quiz of quizzes) {
    const summary = toQuizSummary(quiz);
    const section = quiz.section && bySection.get(quiz.section.toString());
    if (section) section.quizzes.push(summary);
    else courseQuizzes.push(summary);
  }

  return {
    sections: [...bySection.values()],
    quizzes: courseQuizzes,
    totalLessons: lessons.length,
    totalDuration: lessons.reduce((sum, l) => sum + (l.duration || 0), 0),
    totalQuizzes: quizzes.length,
  };
};

// Deletes a course and everything that belongs to it.
export const deleteCourseCascade = async (courseId) => {
  await Promise.all([
    Lesson.deleteMany({ course: courseId }),
    Section.deleteMany({ course: courseId }),
    Enrollment.deleteMany({ course: courseId }),
    QuizAttempt.deleteMany({ course: courseId }),
    Quiz.deleteMany({ course: courseId }),
  ]);
  await Course.deleteOne({ _id: courseId });
};
