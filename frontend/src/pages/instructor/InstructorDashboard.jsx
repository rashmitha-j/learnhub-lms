import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, FileEdit, PlusCircle, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import CourseThumbnail from '../../components/course/CourseThumbnail';
import useApi from '../../hooks/useApi';
import useAuth from '../../hooks/useAuth';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { instructorService } from '../../services/instructorService';
import { formatDate, pluralize } from '../../utils/format';

export default function InstructorDashboard() {
  useDocumentTitle('Instructor dashboard');
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(() => instructorService.dashboard(), []);

  if (loading && !data) return <LoadingSpinner label="Loading dashboard…" />;
  if (error) return <ErrorMessage title="Could not load dashboard" message={error} onRetry={reload} />;

  const { stats, recentCourses, recentEnrollments } = data;

  return (
    <>
      <PageHeader
        eyebrow="Instructor dashboard"
        title={`Hello, ${user.name.split(' ')[0]}`}
        subtitle="Manage your courses and follow your students’ progress."
        actions={
          <Button to="/instructor/courses/create" icon={PlusCircle}>
            Create course
          </Button>
        }
      />

      <div className="stat-grid">
        <StatCard icon={BookOpen} label="Total courses" value={stats.totalCourses} />
        <StatCard icon={CheckCircle2} label="Published" value={stats.publishedCourses} tone="success" />
        <StatCard icon={FileEdit} label="Drafts" value={stats.draftCourses} tone="warning" />
        <StatCard
          icon={Users}
          label="Total students"
          value={stats.totalStudents}
          hint={`${pluralize(stats.totalEnrollments, 'enrollment')} · ${stats.completedEnrollments} completed`}
          tone="info"
        />
      </div>

      {stats.totalCourses === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Create your first course"
          message="Add course details, build the curriculum, then publish when it’s ready."
          action={<Button to="/instructor/courses/create">Create course</Button>}
        />
      ) : (
        <div className="dashboard-grid">
          <section className="card">
            <div className="card-head">
              <h2>Recent enrollments</h2>
            </div>
            {recentEnrollments.length === 0 ? (
              <EmptyState compact icon={Users} title="No students yet" message="Publish a course so students can enroll." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Progress</th>
                      <th>Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEnrollments.map((e) => (
                      <tr key={e._id}>
                        <td>
                          <strong>{e.student.name}</strong>
                          <div className="muted small">{e.student.email}</div>
                        </td>
                        <td>
                          <Link to={`/instructor/courses/${e.course._id}/students`}>{e.course.title}</Link>
                        </td>
                        <td className="table-progress">
                          <ProgressBar value={e.progress} size="sm" />
                        </td>
                        <td className="nowrap">{formatDate(e.enrolledAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Your courses</h2>
              <Link to="/instructor/courses" className="link-muted">
                View all
              </Link>
            </div>
            <ul className="resume-list">
              {recentCourses.map((course) => (
                <li key={course._id} className="resume-item">
                  <CourseThumbnail src={course.thumbnail} title={course.title} className="resume-thumb" />
                  <div className="resume-body">
                    <Link to={`/instructor/courses/${course._id}/curriculum`} className="resume-title">
                      {course.title}
                    </Link>
                    <p className="muted small">
                      {pluralize(course.lessonCount, 'lesson')} · {pluralize(course.studentCount, 'student')}
                    </p>
                  </div>
                  <StatusBadge status={course.published ? 'published' : 'draft'} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
