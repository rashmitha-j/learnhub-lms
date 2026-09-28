import { useState } from 'react';
import { GraduationCap, PlayCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import CourseGrid from '../../components/course/CourseGrid';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { enrollmentService } from '../../services/enrollmentService';
import { enrollmentStatus, formatDate } from '../../utils/format';

const FILTERS = {
  all: () => true,
  'in-progress': (e) => !e.completed,
  completed: (e) => e.completed,
};

export default function MyCoursesPage() {
  useDocumentTitle('My Courses');
  const [filter, setFilter] = useState('all');
  const { data, loading, error, reload } = useApi(() => enrollmentService.mine(), []);

  if (loading && !data) return <LoadingSpinner label="Loading your courses…" />;
  if (error) return <ErrorMessage title="Could not load your courses" message={error} onRetry={reload} />;

  const { enrollments } = data;
  const visible = enrollments.filter(FILTERS[filter]);
  const byCourseId = new Map(enrollments.map((e) => [e.course._id, e]));

  return (
    <>
      <PageHeader title="My Courses" subtitle="Everything you’re enrolled in, with your progress." />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No enrolled courses"
          message="Courses you enroll in will appear here."
          action={<Button to="/courses">Browse courses</Button>}
        />
      ) : (
        <>
          <Tabs
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: 'all', label: 'All', count: enrollments.length },
              { value: 'in-progress', label: 'In progress', count: enrollments.filter(FILTERS['in-progress']).length },
              { value: 'completed', label: 'Completed', count: enrollments.filter(FILTERS.completed).length },
            ]}
          />
          {visible.length === 0 ? (
            <EmptyState
              compact
              title={filter === 'completed' ? 'No completed courses yet' : 'Nothing in progress'}
              message={filter === 'completed' ? 'Finish all lessons in a course to complete it.' : 'All your courses are complete — nice work!'}
            />
          ) : (
            <CourseGrid
              courses={visible.map((e) => e.course)}
              getLink={(course) => `/student/courses/${course._id}/learn`}
              renderFooter={(course) => {
                const enrollment = byCourseId.get(course._id);
                return (
                  <>
                    <div className="card-footer-row">
                      <StatusBadge status={enrollmentStatus(enrollment)} />
                      <span className="muted small">
                        {enrollment.completedCount}/{enrollment.totalLessons} lessons
                      </span>
                    </div>
                    <ProgressBar value={enrollment.progress} size="sm" showValue={false} />
                    <p className="muted small">
                      {enrollment.completed
                        ? `Completed ${formatDate(enrollment.completedAt)}`
                        : `Enrolled ${formatDate(enrollment.enrolledAt)}`}
                    </p>
                    <Button to={`/student/courses/${course._id}/learn`} size="sm" icon={PlayCircle} block>
                      {enrollment.completed ? 'Review course' : enrollment.progress > 0 ? 'Continue' : 'Start course'}
                    </Button>
                  </>
                );
              }}
            />
          )}
        </>
      )}
    </>
  );
}
