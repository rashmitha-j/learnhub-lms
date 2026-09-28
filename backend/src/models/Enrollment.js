import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: ObjectId, ref: 'User', required: true },
    course: { type: ObjectId, ref: 'Course', required: true },
    enrolledAt: { type: Date, default: Date.now },
    completedLessons: { type: [{ type: ObjectId, ref: 'Lesson' }], default: [] },
    // Last lesson the student completed, used to resume the course
    lastLesson: { type: ObjectId, ref: 'Lesson', default: null },
    // Always calculated on the server from completedLessons / total lessons
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1, enrolledAt: -1 });
enrollmentSchema.index({ student: 1, updatedAt: -1 });

export default mongoose.model('Enrollment', enrollmentSchema);
