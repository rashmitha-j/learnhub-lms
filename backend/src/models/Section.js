import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    order: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

sectionSchema.index({ course: 1, order: 1 });

export default mongoose.model('Section', sectionSchema);
