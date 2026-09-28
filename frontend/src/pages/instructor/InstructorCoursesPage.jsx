import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, ListTree, Pencil, PlusCircle, Trash2, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import CourseThumbnail from '../../components/course/CourseThumbnail';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../api/client';
import { courseService } from '../../services/courseService';
import { instructorService } from '../../services/instructorService';
import { formatDate, pluralize } from '../../utils/format';

export default function InstructorCoursesPage() {
  useDocumentTitle('My courses');
  const [status, setStatus] = useState('all');
  const [message, setMessage] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const { data, loading, error, reload, setData } = useApi(() => instructorService.courses(), []);

  if (loading && !data) return <LoadingSpinner label="Loading courses…" />;
  if (error) return <ErrorMessage title="Could not load courses" message={error} onRetry={reload} />;

  const courses = data.courses;
  const visible = courses.filter((c) => status === 'all' || (status === 'published') === c.published);

  const togglePublish = async (course) => {
    setBusyId(course._id);
    setMessage(null);
    try {
      const { course: updated } = await courseService.update(course._id, { published: !course.published });
      setData((prev) => ({
        courses: prev.courses.map((c) => (c._id === updated._id ? { ...c, published: updated.published } : c)),
      }));
      setMessage({ tone: 'success', text: `“${course.title}” is now ${updated.published ? 'published' : 'a draft'}.` });
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
      setData((prev) => ({ courses: prev.courses.filter((c) => c._id !== toDelete._id) }));
      setMessage({ tone: 'success', text: `“${toDelete.title}” was deleted.` });
      setToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="My courses"
        subtitle="Create, edit and publish your courses."
        actions={
          <Button to="/instructor/courses/create" icon={PlusCircle}>
            Create course
          </Button>
        }
      />
      <Alert tone={message?.tone} onClose={() => setMessage(null)}>
        {message?.text}
      </Alert>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="You haven’t created any courses yet"
          message="Start with the basics — you can add sections, lessons and quizzes next."
          action={<Button to="/instructor/courses/create">Create your first course</Button>}
        />
      ) : (
        <>
          <Tabs
            value={status}
            onChange={setStatus}
            tabs={[
              { value: 'all', label: 'All', count: courses.length },
              { value: 'published', label: 'Published', count: courses.filter((c) => c.published).length },
              { value: 'draft', label: 'Drafts', count: courses.filter((c) => !c.published).length },
            ]}
          />
          {visible.length === 0 ? (
            <EmptyState compact title={`No ${status === 'draft' ? 'draft' : 'published'} courses`} />
          ) : (
            <ul className="manage-list">
              {visible.map((course) => (
                <li key={course._id} className="card manage-item">
                  <CourseThumbnail src={course.thumbnail} title={course.title} className="manage-thumb" />
                  <div className="manage-body">
                    <div className="manage-title-row">
                      <Link to={`/instructor/courses/${course._id}/curriculum`} className="manage-title">
                        {course.title}
                      </Link>
                      <StatusBadge status={course.published ? 'published' : 'draft'} />
                    </div>
                    <p className="muted small">
                      {course.category} · {course.level} · {pluralize(course.lessonCount, 'lesson')} ·{' '}
                      {pluralize(course.studentCount, 'student')} · Updated {formatDate(course.updatedAt)}
                    </p>
                    <div className="manage-actions">
                      <Button to={`/instructor/courses/${course._id}/edit`} size="sm" variant="outline" icon={Pencil}>
                        Edit
                      </Button>
                      <Button to={`/instructor/courses/${course._id}/curriculum`} size="sm" variant="outline" icon={ListTree}>
                        Curriculum
                      </Button>
                      <Button to={`/instructor/courses/${course._id}/students`} size="sm" variant="outline" icon={Users}>
                        Students
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={course.published ? EyeOff : Eye}
                        loading={busyId === course._id && !toDelete}
                        onClick={() => togglePublish(course)}
                      >
                        {course.published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button size="sm" variant="ghost-danger" icon={Trash2} onClick={() => setToDelete(course)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Delete course?"
        message={`“${toDelete?.title}” and all of its sections, lessons, quizzes, enrollments and quiz results will be permanently deleted.`}
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
