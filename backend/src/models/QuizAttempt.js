import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

// Snapshot of each question at submission time, so results stay accurate if the quiz is edited later.
const answerSchema = new mongoose.Schema(
  {
    questionId: { type: ObjectId, required: true },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    selectedOption: { type: Number, default: null },
    correctAnswer: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: ObjectId, ref: 'User', required: true },
    quiz: { type: ObjectId, ref: 'Quiz', required: true },
    course: { type: ObjectId, ref: 'Course', required: true },
    answers: { type: [answerSchema], default: [] },
    correctCount: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 0 },
    // Percentage, always calculated on the server
    score: { type: Number, required: true, min: 0, max: 100 },
    passed: { type: Boolean, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quiz: 1, student: 1, submittedAt: -1 });
quizAttemptSchema.index({ student: 1, submittedAt: -1 });
quizAttemptSchema.index({ course: 1, submittedAt: -1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
