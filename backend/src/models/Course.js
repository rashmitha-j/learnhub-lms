import mongoose from 'mongoose';
import { CATEGORIES, LEVELS } from '../utils/constants.js';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 5,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: 20,
      maxlength: 5000,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: { type: String, enum: CATEGORIES, required: true },
    level: { type: String, enum: LEVELS, required: true },
    thumbnail: { type: String, trim: true, default: '' },
    requirements: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
    learningOutcomes: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Public catalog: published courses, newest first, optionally by category/level
courseSchema.index({ published: 1, createdAt: -1 });
courseSchema.index({ published: 1, category: 1, level: 1 });
// Instructor's own course list
courseSchema.index({ instructor: 1, updatedAt: -1 });

export default mongoose.model('Course', courseSchema);
