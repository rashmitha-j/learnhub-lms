import { Link } from 'react-router-dom';
import { Award, BookOpen, ClipboardCheck, Compass, GraduationCap, PlayCircle, TrendingUp, User } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import CourseThumbnail from '../../components/course/CourseThumbnail';
import useApi from '../../hooks/useApi';
import useAuth from '../../hooks/useAuth';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { enrollmentService } from '../../services/enrollmentService';
import { quizService } from '../../services/quizService';
import { formatDate, pluralize } from '../../utils/format';

const loadDashboard = async () => {
  const [{ enrollments }, { attempts }] = await Promise.all([enrollmentService.mine(), quizService.myAttempts()]);
  return { enrollments, attempts };
};

export default function StudentDashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(loadDashboard, []);

  if (loading && !data) return <LoadingSpinner label="Loading your dashboard…" />;
  if (error) return <ErrorMessage title="Could not load your dashboard" message={error} onRetry={reload} />;

  const { enrollments, attempts } = data;
  const completed = enrollments.filter((e) => e.completed);
  const inProgress = enrollments.filter((e) => !e.completed);
  const averageScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : null;
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <PageHeader
        eyebrow="Student dashboard"
        title={`Welcome back, ${firstName}!`}
        subtitle="Here’s an overview of your learning."
        actions={
          <Button to="/courses" icon={Compass}>
            Browse courses
          </Button>
        }
      />

      <div className="stat-grid">
        <StatCard icon={BookOpen} label="Enrolled courses" value={enrollments.length} />
        <StatCard icon={TrendingUp} label="In progress" value={inProgress.length} tone="info" />
        <StatCard icon={Award} label="Completed" value={completed.length} tone="success" />
        <StatCard
          icon={ClipboardCheck}
          label="Avg. quiz score"
          value={averageScore === null ? '—' : `${averageScore}%`}
          hint={pluralize(attempts.length, 'attempt')}
          tone="warning"
        />
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="You haven’t enrolled in any courses yet"
          message="Explore the catalog and enroll in your first course to get started."
          action={<Button to="/courses">Find a course</Button>}
        />
      ) : (
        <div className="dashboard-grid">
          <section className="card">
            <div className="card-head">
              <h2>Recent courses</h2>
              <Link to="/student/courses" className="link-muted">
                View all
              </Link>
            </div>
            <ul className="resume-list">
              {enrollments.slice(0, 4).map((enrollment) => (
                <li key={enrollment._id} className="resume-item">
                  <CourseThumbnail src={enrollment.course.thumbnail} title={enrollment.course.title} className="resume-thumb" />
                  <div className="resume-body">
                    <Link to={`/student/courses/${enrollment.course._id}/learn`} className="resume-title">
                      {enrollment.course.title}
                    </Link>
                    <p className="muted small">
                      {enrollment.completedCount} of {pluralize(enrollment.totalLessons, 'lesson')} completed
                    </p>
                    <ProgressBar value={enrollment.progress} size="sm" />
                  </div>
                  <Button
                    to={`/student/courses/${enrollment.course._id}/learn`}
                    variant={enrollment.completed ? 'outline' : 'primary'}
                    size="sm"
                    icon={PlayCircle}
                  >
                    {enrollment.completed ? 'Review' : 'Continue'}
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <div className="stack">
            <section className="card">
              <div className="card-head">
                <h2>Recent quiz results</h2>
              </div>
              {attempts.length === 0 ? (
                <EmptyState compact icon={ClipboardCheck} title="No quiz attempts yet" message="Quizzes appear inside your courses." />
              ) : (
                <ul className="attempt-list">
                  {attempts.slice(0, 5).map((attempt) => (
                    <li key={attempt._id}>
                      <div>
                        <Link to={`/student/quizzes/${attempt.quiz._id}/result`} className="attempt-title">
                          {attempt.quiz.title}
                        </Link>
                        <p className="muted small">
                          {attempt.course.title} · {formatDate(attempt.submittedAt)}
                        </p>
                      </div>
                      <div className="attempt-score">
                        <strong>{attempt.score}%</strong>
                        <StatusBadge status={attempt.passed ? 'passed' : 'failed'} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <h2>Quick actions</h2>
              <div className="quick-actions">
                <Button to="/student/courses" variant="outline" icon={GraduationCap} block>
                  My courses
                </Button>
                <Button to="/courses" variant="outline" icon={Compass} block>
                  Browse catalog
                </Button>
                <Button to="/student/profile" variant="outline" icon={User} block>
                  Edit profile
                </Button>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
