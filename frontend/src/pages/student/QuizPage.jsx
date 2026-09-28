import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, History, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import ProgressBar from '../../components/ui/ProgressBar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../api/client';
import { quizService } from '../../services/quizService';
import { pluralize } from '../../utils/format';

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data, loading, error, status, reload } = useApi(() => quizService.get(id), [id]);
  useDocumentTitle(data?.quiz.title || 'Quiz');

  if (loading && !data) return <LoadingSpinner label="Loading quiz…" />;

  if (error) {
    return (
      <ErrorMessage
        title={status === 403 ? 'You can’t take this quiz' : status === 404 ? 'Quiz not found' : 'Could not load quiz'}
        message={status === 403 ? 'Enroll in the course to take its quizzes.' : error}
        onRetry={status === 403 || status === 404 ? undefined : reload}
        action={<Button to="/student/courses">My courses</Button>}
      />
    );
  }

  const { quiz, course, attemptCount } = data;
  const answeredCount = Object.keys(answers).length;
  const total = quiz.questions.length;
  const allAnswered = answeredCount === total;

  const submit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = quiz.questions.map((q) => ({
        questionId: q._id,
        selectedOption: answers[q._id] ?? null,
      }));
      const { attempt } = await quizService.submit(quiz._id, payload);
      navigate(`/student/quizzes/${quiz._id}/result`, { state: { attemptId: attempt._id } });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (allAnswered) submit();
    else setConfirmOpen(true);
  };

  return (
    <div className="quiz-page">
      <Link to={`/student/courses/${course._id}/learn`} className="link-muted back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Back to {course.title}
      </Link>

      <header className="quiz-header card">
        <span className="stat-icon tone-warning">
          <ClipboardCheck size={22} aria-hidden="true" />
        </span>
        <div className="quiz-header-body">
          <h1>{quiz.title}</h1>
          {quiz.description && <p className="muted">{quiz.description}</p>}
          <p className="muted small">
            {pluralize(total, 'question')} · Passing score {quiz.passingScore}%
            {attemptCount > 0 && ` · ${pluralize(attemptCount, 'previous attempt')}`}
          </p>
        </div>
        {attemptCount > 0 && (
          <Button to={`/student/quizzes/${quiz._id}/result`} variant="outline" size="sm" icon={History}>
            Past results
          </Button>
        )}
      </header>

      {total === 0 ? (
        <EmptyState title="This quiz has no questions yet" />
      ) : (
        <form onSubmit={onSubmit} className="quiz-form">
          <div className="quiz-progress card">
            <ProgressBar value={(answeredCount / total) * 100} label={`${answeredCount} of ${total} answered`} showValue={false} />
          </div>

          {quiz.questions.map((question, index) => (
            <fieldset key={question._id} className="card question-card">
              <legend className="question-title">
                <span className="question-number">Question {index + 1}</span>
                {question.question}
              </legend>
              <div className="options">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question._id] === optionIndex;
                  return (
                    <label key={optionIndex} className={`option ${selected ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name={question._id}
                        checked={selected}
                        onChange={() => setAnswers((prev) => ({ ...prev, [question._id]: optionIndex }))}
                      />
                      <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <Alert tone="error">{submitError}</Alert>
          <div className="quiz-submit">
            <p className="muted small">
              {allAnswered ? 'All questions answered.' : `${total - answeredCount} unanswered — unanswered questions count as incorrect.`}
            </p>
            <Button type="submit" size="lg" icon={Send} loading={submitting}>
              Submit quiz
            </Button>
          </div>
        </form>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Submit with unanswered questions?"
        message={`You have ${pluralize(total - answeredCount, 'unanswered question')}. They will be marked incorrect.`}
        confirmLabel="Submit anyway"
        variant="primary"
        loading={submitting}
        onConfirm={submit}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
