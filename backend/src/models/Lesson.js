import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    // Denormalized from the section so progress and access checks need no extra lookup
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    videoUrl: { type: String, required: [true, 'Video URL is required'], trim: true },
    // Duration in minutes
    duration: { type: Number, default: 0, min: 0, max: 1440 },
    order: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

lessonSchema.index({ section: 1, order: 1 });
lessonSchema.index({ course: 1 });

export default mongoose.model('Lesson', lessonSchema);
