import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Search, Trash2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import useApi from '../../hooks/useApi';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../api/client';
import { adminService } from '../../services/adminService';
import { courseService } from '../../services/courseService';
import { formatDate, pluralize } from '../../utils/format';

export default function AdminCoursesPage() {
  useDocumentTitle('Courses');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data, loading, error, reload } = useApi(
    () => adminService.courses({ search: debouncedSearch || undefined, status: status || undefined, page }),
    [debouncedSearch, status, page]
  );

  const togglePublish = async (course) => {
    setBusyId(course._id);
    setMessage(null);
    try {
      await courseService.update(course._id, { published: !course.published });
      setMessage({ tone: 'success', text: `“${course.title}” ${course.published ? 'unpublished' : 'published'}.` });
      reload();
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setBusyId(toDelete._id);
    setDeleteError('');
    try {
      await courseService.remove(toDelete._id);
      setMessage({ tone: 'success', text: `“${toDelete.title}” deleted.` });
      setToDelete(null);
      reload();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title="Courses" subtitle="All courses on the platform, including drafts." />
      <Alert tone={message?.tone} onClose={() => setMessage(null)}>
        {message?.text}
      </Alert>

      <div className="card toolbar">
        <label className="toolbar-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by title"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search courses"
            maxLength={100}
          />
        </label>
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Drafts' },
          ]}
          placeholder="All statuses"
        />
      </div>

      {loading && !data ? (
        <LoadingSpinner label="Loading courses…" />
      ) : error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : data.courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses found" />
      ) : (
        <>
          <p className="results-count muted">{pluralize(data.pagination.total, 'course')}</p>
          <div className="card table-card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Status</th>
                    <th>Lessons</th>
                    <th>Students</th>
                    <th>Created</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.courses.map((course) => (
                    <tr key={course._id}>
                      <td>
                        <Link to={`/courses/${course._id}`}>
                          <strong>{course.title}</strong>
                        </Link>
                        <div className="muted small">
                          {course.category} · {course.level}
                        </div>
                      </td>
                      <td>{course.instructor?.name ?? '—'}</td>
                      <td>
                        <StatusBadge status={course.published ? 'published' : 'draft'} />
                      </td>
                      <td>{course.lessonCount}</td>
                      <td>{course.studentCount}</td>
                      <td className="nowrap">{formatDate(course.createdAt)}</td>
                      <td className="table-actions">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={course.published ? EyeOff : Eye}
                          loading={busyId === course._id && !toDelete}
                          onClick={() => togglePublish(course)}
                        >
                          {course.published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost-danger"
                          icon={Trash2}
                          onClick={() => setToDelete(course)}
                          aria-label={`Delete ${course.title}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
        </>
      )}

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Delete course?"
        message={`“${toDelete?.title}” will be permanently deleted along with its curriculum, enrollments and quiz results.`}
        confirmLabel="Delete course"
        loading={busyId === toDelete?._id}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => {
          setToDelete(null);
          setDeleteError('');
        }}
      />
    </>
  );
}
