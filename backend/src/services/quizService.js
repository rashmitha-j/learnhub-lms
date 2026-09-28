// Student-safe view of a quiz: correct answers are stripped.
export const toStudentQuiz = (quiz) => ({
  _id: quiz._id,
  course: quiz.course,
  section: quiz.section,
  title: quiz.title,
  description: quiz.description,
  passingScore: quiz.passingScore,
  questionCount: quiz.questions.length,
  questions: quiz.questions.map((q) => ({ _id: q._id, question: q.question, options: q.options })),
});

// Normalizes questions from a request body to exactly the stored fields.
export const normalizeQuestions = (questions) =>
  questions.map((q) => ({
    question: q.question,
    options: q.options,
    correctAnswer: Number(q.correctAnswer),
  }));

// Grades a submission on the server. `answers` is [{ questionId, selectedOption }];
// unanswered or out-of-range answers count as incorrect.
export const gradeSubmission = (quiz, answers) => {
  const selectedById = new Map(answers.map((a) => [String(a.questionId), a.selectedOption]));

  const graded = quiz.questions.map((q) => {
    const raw = selectedById.get(q._id.toString());
    const selected = Number.isInteger(raw) && raw >= 0 && raw < q.options.length ? raw : null;
    return {
      questionId: q._id,
      question: q.question,
      options: q.options,
      selectedOption: selected,
      correctAnswer: q.correctAnswer,
      isCorrect: selected === q.correctAnswer,
    };
  });

  const totalQuestions = graded.length;
  const correctCount = graded.filter((a) => a.isCorrect).length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    answers: graded,
    correctCount,
    totalQuestions,
    score,
    passed: score >= quiz.passingScore,
  };
};
