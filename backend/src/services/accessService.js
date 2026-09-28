import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../utils/constants.js';
import { sameId } from '../utils/helpers.js';

export const findCourseOrThrow = async (courseId) => {
  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound('Course not found');
  return course;
};

// Admins manage every course; instructors only the courses they own.
export const isCourseManager = (course, user) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return user.role === ROLES.INSTRUCTOR && sameId(course.instructor, user._id);
};

export const assertCourseManager = (course, user) => {
  if (!isCourseManager(course, user)) {
    throw ApiError.forbidden('You can only manage your own courses');
  }
};

export const getManagedCourse = async (courseId, user) => {
  const course = await findCourseOrThrow(courseId);
  assertCourseManager(course, user);
  return course;
};

export const getManagedSection = async (sectionId, user) => {
  const section = await Section.findById(sectionId);
  if (!section) throw ApiError.notFound('Section not found');
  const course = await getManagedCourse(section.course, user);
  return { section, course };
};

export const getManagedLesson = async (lessonId, user) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw ApiError.notFound('Lesson not found');
  const course = await getManagedCourse(lesson.course, user);
  return { lesson, course };
};

// Course content (videos, quizzes) is available to the course manager or an enrolled student.
export const assertContentAccess = async (course, user) => {
  if (isCourseManager(course, user)) return { canManage: true, enrollment: null };

  if (user.role === ROLES.STUDENT) {
    const enrollment = await Enrollment.findOne({ student: user._id, course: course._id });
    if (enrollment) return { canManage: false, enrollment };
  }

  throw ApiError.forbidden('You must be enrolled in this course to access its content');
};
