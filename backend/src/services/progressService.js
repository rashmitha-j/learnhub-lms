import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';

export const calculateProgress = (completedCount, totalLessons) =>
  totalLessons > 0 ? Math.floor((Math.min(completedCount, totalLessons) / totalLessons) * 100) : 0;

// Recomputes progress/completed/completedAt for matching enrollments of a course in one
// database round trip. Progress is always derived from completedLessons, never from client input.
export const recalculateProgress = async (courseId, filter = {}) => {
  const totalLessons = await Lesson.countDocuments({ course: courseId });
  const completedCount = { $size: '$completedLessons' };
  const isComplete = totalLessons > 0 ? { $gte: [completedCount, totalLessons] } : { $literal: false };

  await Enrollment.updateMany(
    { ...filter, course: courseId },
    [
      {
        $set: {
          progress:
            totalLessons > 0
              ? {
                  $floor: {
                    $multiply: [{ $divide: [{ $min: [completedCount, totalLessons] }, totalLessons] }, 100],
                  },
                }
              : 0,
          completed: isComplete,
          completedAt: { $cond: [isComplete, { $ifNull: ['$completedAt', '$$NOW'] }, null] },
        },
      },
    ],
    { updatePipeline: true }
  );

  return totalLessons;
};

// Marks a lesson complete for an enrollment. $addToSet keeps it idempotent even under
// concurrent requests, so a lesson can never be counted twice.
export const completeLesson = async (enrollment, lessonId) => {
  const alreadyCompleted = enrollment.completedLessons.some((id) => id.equals(lessonId));

  await Enrollment.updateOne(
    { _id: enrollment._id },
    { $addToSet: { completedLessons: lessonId }, $set: { lastLesson: lessonId } }
  );
  const totalLessons = await recalculateProgress(enrollment.course, { _id: enrollment._id });
  const updated = await Enrollment.findById(enrollment._id).lean();

  return { enrollment: updated, alreadyCompleted, totalLessons };
};

// Removes deleted lessons from every enrollment of a course and refreshes progress.
export const removeLessonsFromProgress = async (courseId, lessonIds) => {
  if (lessonIds.length > 0) {
    await Enrollment.updateMany(
      { course: courseId },
      { $pull: { completedLessons: { $in: lessonIds } } }
    );
    await Enrollment.updateMany(
      { course: courseId, lastLesson: { $in: lessonIds } },
      { $set: { lastLesson: null } }
    );
  }
  await recalculateProgress(courseId);
};

// Returns { courseId: lessonCount } for the given courses using one aggregation.
export const countLessonsByCourse = async (courseIds) => {
  const rows = await Lesson.aggregate([
    { $match: { course: { $in: courseIds } } },
    { $group: { _id: '$course', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
};
