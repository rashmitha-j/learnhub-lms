import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardCheck, ListTree, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import StatCard from '../../components/ui/StatCard';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { courseService } from '../../services/courseService';
import { enrollmentStatus, formatDate } from '../../utils/format';

const loadStudents = async (id) => {
  const [students, { attempts }] = await Promise.all([courseService.students(id), courseService.quizAttempts(id)]);
  return { ...students, attempts };
};

export default function CourseStudentsPage() {
  const { id } = useParams();
  const [tab, setTab] = useState('students');
  const { data, loading, error, status, reload } = useApi(() => loadStudents(id), [id]);
  useDocumentTitle(data ? `Students · ${data.course.title}` : 'Students');

  if (loading && !data) return <LoadingSpinner label="Loading students…" />;
  if (error) {
    return (
      <ErrorMessage
        title={status === 403 ? 'You can only view students in your own courses' : status === 404 ? 'Course not found' : 'Could not load students'}
        message={error}
        onRetry={status === 403 || status === 404 ? undefined : reload}
        action={<Button to="/instructor/courses">Back to my courses</Button>}
      />
    );
  }

  const { course, enrollments, attempts, totalLessons } = data;
  const completed = enrollments.filter((e) => e.completed).length;
  const averageProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Students & results"
        title={course.title}
        subtitle={`${totalLessons} lessons · ${course.published ? 'Published' : 'Draft'}`}
        actions={
          <Button to={`/instructor/courses/${course._id}/curriculum`} variant="outline" icon={ListTree}>
            Curriculum
          </Button>
        }
      />

      <div className="stat-grid">
        <StatCard icon={Users} label="Enrolled students" value={enrollments.length} />
        <StatCard icon={Users} label="Completed" value={completed} tone="success" />
        <StatCard icon={Users} label="Average progress" value={`${averageProgress}%`} tone="info" />
        <StatCard icon={ClipboardCheck} label="Quiz attempts" value={attempts.length} tone="warning" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'students', label: 'Students', count: enrollments.length },
          { value: 'quizzes', label: 'Quiz results', count: attempts.length },
        ]}
      />

      {tab === 'students' ? (
        enrollments.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students yet"
            message={course.published ? 'Students who enroll will appear here.' : 'Publish this course so students can enroll.'}
          />
        ) : (
          <div className="card table-card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Enrolled</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => (
                    <tr key={e._id}>
                      <td>
                        <strong>{e.student.name}</strong>
                        <div className="muted small">{e.student.email}</div>
                      </td>
                      <td>
                        <StatusBadge status={enrollmentStatus(e)} />
                      </td>
                      <td className="table-progress">
                        <ProgressBar value={e.progress} size="sm" />
                      </td>
                      <td className="nowrap">{formatDate(e.enrolledAt)}</td>
                      <td className="nowrap">{e.completed ? formatDate(e.completedAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : attempts.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No quiz attempts" message="Quiz results from your students will appear here." />
      ) : (
        <div className="card table-card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <strong>{a.student?.name ?? 'Deleted user'}</strong>
                      <div className="muted small">{a.student?.email}</div>
                    </td>
                    <td>{a.quiz?.title ?? 'Deleted quiz'}</td>
                    <td>
                      {a.score}% <span className="muted small">({a.correctCount}/{a.totalQuestions})</span>
                    </td>
                    <td>
                      <StatusBadge status={a.passed ? 'passed' : 'failed'} />
                    </td>
                    <td className="nowrap">{formatDate(a.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
