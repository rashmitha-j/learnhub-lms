import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: 1000,
  },
  options: {
    type: [{ type: String, trim: true, maxlength: 300 }],
    validate: {
      validator: (options) => options.length >= 2 && options.length <= 6,
      message: 'Each question needs between 2 and 6 options',
    },
  },
  // Index into options. Never sent to students before they submit.
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer is required'],
    min: 0,
    validate: {
      validator(value) {
        return value < this.options.length;
      },
      message: 'Correct answer must match one of the options',
    },
  },
});

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    // Optional: quiz belongs to a specific section; null means a course-level quiz
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (questions) => questions.length >= 1 && questions.length <= 50,
        message: 'A quiz needs between 1 and 50 questions',
      },
    },
  },
  { timestamps: true }
);

quizSchema.index({ course: 1, section: 1 });

export default mongoose.model('Quiz', quizSchema);
