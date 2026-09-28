import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getManagedCourse, getManagedSection } from '../services/accessService.js';
import { applyOrder } from '../services/orderService.js';
import { removeLessonsFromProgress } from '../services/progressService.js';

// POST /api/courses/:courseId/sections
export const createSection = async (req, res) => {
  const course = await getManagedCourse(req.params.courseId, req.user);

  const last = await Section.findOne({ course: course._id }).sort({ order: -1 }).select('order').lean();
  const section = await Section.create({
    course: course._id,
    title: req.body.title,
    order: last ? last.order + 1 : 0,
  });

  sendSuccess(res, { statusCode: 201, message: 'Section created', data: { section } });
};

// PUT /api/sections/:id
export const updateSection = async (req, res) => {
  const { section } = await getManagedSection(req.params.id, req.user);

  if (req.body.title !== undefined) section.title = req.body.title;
  if (req.body.order !== undefined) section.order = req.body.order;
  await section.save();

  sendSuccess(res, { message: 'Section updated', data: { section } });
};

// DELETE /api/sections/:id — deletes its lessons; its quizzes become course-level quizzes
export const deleteSection = async (req, res) => {
  const { section, course } = await getManagedSection(req.params.id, req.user);

  const lessonIds = await Lesson.find({ section: section._id }).distinct('_id');
  await Promise.all([
    Lesson.deleteMany({ section: section._id }),
    Quiz.updateMany({ section: section._id }, { $set: { section: null } }),
    Section.deleteOne({ _id: section._id }),
  ]);
  await removeLessonsFromProgress(course._id, lessonIds);

  sendSuccess(res, { message: 'Section deleted' });
};

// PATCH /api/courses/:courseId/sections/reorder  { sectionIds: [...] }
export const reorderSections = async (req, res) => {
  const course = await getManagedCourse(req.params.courseId, req.user);
  await applyOrder(Section, { course: course._id }, req.body.sectionIds);

  const sections = await Section.find({ course: course._id }).sort({ order: 1 }).lean();
  sendSuccess(res, { message: 'Sections reordered', data: { sections } });
};
