import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { adminService } from '../../services/adminService';
import { enrollmentStatus, formatDate, pluralize } from '../../utils/format';

export default function AdminEnrollmentsPage() {
  useDocumentTitle('Enrollments');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi(() => adminService.enrollments({ page }), [page]);

  return (
    <>
      <PageHeader title="Enrollments" subtitle="Every enrollment on the platform, newest first." />

      {loading && !data ? (
        <LoadingSpinner label="Loading enrollments…" />
      ) : error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : data.enrollments.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No enrollments yet" />
      ) : (
        <>
          <p className="results-count muted">{pluralize(data.pagination.total, 'enrollment')}</p>
          <div className="card table-card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {data.enrollments.map((e) => (
                    <tr key={e._id}>
                      <td>
                        <strong>{e.student?.name ?? 'Deleted user'}</strong>
                        <div className="muted small">{e.student?.email}</div>
                      </td>
                      <td>{e.course ? <Link to={`/courses/${e.course._id}`}>{e.course.title}</Link> : 'Deleted course'}</td>
                      <td>
                        <StatusBadge status={enrollmentStatus(e)} />
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
          </div>
          <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
