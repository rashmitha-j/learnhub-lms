import Lesson from '../models/Lesson.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { pick } from '../utils/helpers.js';
import {
  assertContentAccess,
  findCourseOrThrow,
  getManagedLesson,
  getManagedSection,
} from '../services/accessService.js';
import { applyOrder } from '../services/orderService.js';
import { recalculateProgress, removeLessonsFromProgress } from '../services/progressService.js';

const EDITABLE_FIELDS = ['title', 'description', 'videoUrl', 'duration'];

// GET /api/lessons/:id — enrolled students and course managers only
export const getLesson = async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).lean();
  if (!lesson) throw ApiError.notFound('Lesson not found');

  const course = await findCourseOrThrow(lesson.course);
  await assertContentAccess(course, req.user);

  sendSuccess(res, { data: { lesson } });
};

// POST /api/sections/:sectionId/lessons
export const createLesson = async (req, res) => {
  const { section, course } = await getManagedSection(req.params.sectionId, req.user);

  const last = await Lesson.findOne({ section: section._id }).sort({ order: -1 }).select('order').lean();
  const lesson = await Lesson.create({
    ...pick(req.body, EDITABLE_FIELDS),
    section: section._id,
    course: course._id,
    order: last ? last.order + 1 : 0,
  });

  // A new lesson lowers the progress of existing enrollments
  await recalculateProgress(course._id);

  sendSuccess(res, { statusCode: 201, message: 'Lesson created', data: { lesson } });
};

// PUT /api/lessons/:id
export const updateLesson = async (req, res) => {
  const { lesson } = await getManagedLesson(req.params.id, req.user);
  Object.assign(lesson, pick(req.body, EDITABLE_FIELDS));
  await lesson.save();

  sendSuccess(res, { message: 'Lesson updated', data: { lesson } });
};

// DELETE /api/lessons/:id
export const deleteLesson = async (req, res) => {
  const { lesson, course } = await getManagedLesson(req.params.id, req.user);

  await Lesson.deleteOne({ _id: lesson._id });
  await removeLessonsFromProgress(course._id, [lesson._id]);

  sendSuccess(res, { message: 'Lesson deleted' });
};

// PATCH /api/sections/:sectionId/lessons/reorder  { lessonIds: [...] }
export const reorderLessons = async (req, res) => {
  const { section } = await getManagedSection(req.params.sectionId, req.user);
  await applyOrder(Lesson, { section: section._id }, req.body.lessonIds);

  const lessons = await Lesson.find({ section: section._id }).sort({ order: 1 }).lean();
  sendSuccess(res, { message: 'Lessons reordered', data: { lessons } });
};
