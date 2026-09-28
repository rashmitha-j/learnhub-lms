import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardCheck, RotateCcw, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { quizService } from '../../services/quizService';
import { formatDate } from '../../utils/format';

function ScoreRing({ score, passed }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={`score-ring ${passed ? 'passed' : 'failed'}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} className="score-ring-track" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="score-ring-fill"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <span className="score-ring-value">{score}%</span>
    </div>
  );
}

export default function QuizResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const [selectedId, setSelectedId] = useState(location.state?.attemptId || null);
  const { data, loading, error, status, reload } = useApi(() => quizService.results(id), [id]);
  useDocumentTitle(data ? `${data.quiz.title} results` : 'Quiz results');

  if (loading && !data) return <LoadingSpinner label="Loading results…" />;
  if (error) {
    return (
      <ErrorMessage
        title={status === 404 ? 'Quiz not found' : 'Could not load results'}
        message={error}
        onRetry={status === 404 ? undefined : reload}
        action={<Button to="/student/dashboard">Dashboard</Button>}
      />
    );
  }

  const { quiz, attempts } = data;
  const backToCourse = (
    <Link to={`/student/courses/${quiz.course._id}/learn`} className="link-muted back-link">
      <ArrowLeft size={16} aria-hidden="true" /> Back to {quiz.course.title}
    </Link>
  );

  if (attempts.length === 0) {
    return (
      <div className="quiz-page">
        {backToCourse}
        <EmptyState
          icon={ClipboardCheck}
          title="No quiz attempts yet"
          message="Take the quiz to see your results here."
          action={<Button to={`/student/quizzes/${quiz._id}`}>Take quiz</Button>}
        />
      </div>
    );
  }

  const attempt = attempts.find((a) => a._id === selectedId) || attempts[0];
  const best = Math.max(...attempts.map((a) => a.score));

  return (
    <div className="quiz-page">
      {backToCourse}

      <section className="card result-summary">
        <ScoreRing score={attempt.score} passed={attempt.passed} />
        <div className="result-summary-body">
          <p className="eyebrow">Quiz result</p>
          <h1>{quiz.title}</h1>
          <div className="result-badges">
            <StatusBadge status={attempt.passed ? 'passed' : 'failed'} />
            <span className="muted small">Passing score {quiz.passingScore}%</span>
          </div>
          <dl className="result-stats">
            <div>
              <dt>Correct</dt>
              <dd>
                {attempt.correctCount} / {attempt.totalQuestions}
              </dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{formatDate(attempt.submittedAt)}</dd>
            </div>
            <div>
              <dt>Best score</dt>
              <dd>{best}%</dd>
            </div>
          </dl>
          <div className="result-actions">
            <Button to={`/student/quizzes/${quiz._id}`} icon={RotateCcw}>
              Retake quiz
            </Button>
            <Button to={`/student/courses/${quiz.course._id}/learn`} variant="outline">
              Continue course
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-subtitle">Answer review</h2>
        {attempt.answers.map((answer, index) => (
          <article key={answer.questionId} className={`card question-card review ${answer.isCorrect ? 'is-correct' : 'is-wrong'}`}>
            <div className="question-title">
              <span className="question-number">
                {answer.isCorrect ? (
                  <CheckCircle2 size={16} className="text-success" aria-hidden="true" />
                ) : (
                  <XCircle size={16} className="text-danger" aria-hidden="true" />
                )}
                Question {index + 1} · {answer.isCorrect ? 'Correct' : answer.selectedOption === null ? 'Not answered' : 'Incorrect'}
              </span>
              {answer.question}
            </div>
            <ul className="options">
              {answer.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === answer.correctAnswer;
                const isSelected = optionIndex === answer.selectedOption;
                return (
                  <li
                    key={optionIndex}
                    className={`option ${isCorrect ? 'correct' : ''} ${isSelected && !isCorrect ? 'wrong' : ''}`}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                    <span>{option}</span>
                    {isCorrect && <span className="option-tag">Correct answer</span>}
                    {isSelected && !isCorrect && <span className="option-tag">Your answer</span>}
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </section>

      {attempts.length > 1 && (
        <section className="card">
          <h2>Attempt history</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a._id} className={a._id === attempt._id ? 'row-active' : ''}>
                    <td>{formatDate(a.submittedAt)}</td>
                    <td>
                      {a.score}% ({a.correctCount}/{a.totalQuestions})
                    </td>
                    <td>
                      <StatusBadge status={a.passed ? 'passed' : 'failed'} />
                    </td>
                    <td className="table-actions">
                      {a._id === attempt._id ? (
                        <span className="muted small">Viewing</span>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setSelectedId(a._id)}>
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
