import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ClipboardCheck,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import CourseSteps from '../../components/course/CourseSteps';
import SectionFormModal from '../../components/curriculum/SectionFormModal';
import LessonFormModal from '../../components/curriculum/LessonFormModal';
import QuizEditorModal from '../../components/curriculum/QuizEditorModal';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../api/client';
import { courseService } from '../../services/courseService';
import { sectionService } from '../../services/sectionService';
import { lessonService } from '../../services/lessonService';
import { quizService } from '../../services/quizService';
import { formatDuration, pluralize } from '../../utils/format';

// Returns a copy of ids with the item at `index` moved one step in `direction` (-1 or 1).
const move = (ids, index, direction) => {
  const next = [...ids];
  [next[index], next[index + direction]] = [next[index + direction], next[index]];
  return next;
};

function QuizRow({ quiz, onEdit, onDelete }) {
  return (
    <li className="curriculum-row curriculum-quiz">
      <ClipboardCheck size={18} aria-hidden="true" />
      <div className="curriculum-row-body">
        <span className="curriculum-row-title">{quiz.title}</span>
        <span className="muted small">
          {pluralize(quiz.questionCount, 'question')} · pass {quiz.passingScore}%
        </span>
      </div>
      <div className="row-actions">
        <Button size="sm" variant="ghost" icon={Pencil} onClick={onEdit} aria-label={`Edit ${quiz.title}`} />
        <Button size="sm" variant="ghost-danger" icon={Trash2} onClick={onDelete} aria-label={`Delete ${quiz.title}`} />
      </div>
    </li>
  );
}

export default function CurriculumPage() {
  const { id } = useParams();
  const location = useLocation();
  const { data, loading, error, status, reload } = useApi(() => courseService.content(id), [id]);
  useDocumentTitle(data ? `Curriculum · ${data.course.title}` : 'Curriculum');

  const [message, setMessage] = useState(
    location.state?.created ? { tone: 'success', text: 'Course created! Now add sections and lessons.' } : null
  );
  const [busy, setBusy] = useState(false);
  // { type: 'section' | 'lesson' | 'quiz', ...context }
  const [modal, setModal] = useState(null);
  // { kind, id, label }
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  if (loading && !data) return <LoadingSpinner label="Loading curriculum…" />;
  if (error) {
    return (
      <ErrorMessage
        title={status === 403 ? 'You can only manage your own courses' : status === 404 ? 'Course not found' : 'Could not load curriculum'}
        message={error}
        onRetry={status === 403 || status === 404 ? undefined : reload}
        action={<Button to="/instructor/courses">Back to my courses</Button>}
      />
    );
  }

  const { course, curriculum } = data;
  const sections = curriculum.sections;

  // Runs a mutation, shows feedback and refreshes the curriculum.
  const run = async (action, successText) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      if (successText) setMessage({ tone: 'success', text: successText });
      reload();
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const closeModal = () => setModal(null);
  const afterSave = (text) => {
    setModal(null);
    setMessage({ tone: 'success', text });
    reload();
  };

  const togglePublish = () =>
    run(
      () => courseService.update(course._id, { published: !course.published }),
      course.published ? 'Course unpublished — it’s now hidden from the catalog.' : 'Course published! Students can now enroll.'
    );

  const reorderSections = (index, direction) =>
    run(() => sectionService.reorder(course._id, move(sections.map((s) => s._id), index, direction)));

  const reorderLessons = (section, index, direction) =>
    run(() => lessonService.reorder(section._id, move(section.lessons.map((l) => l._id), index, direction)));

  const confirmDelete = async () => {
    const services = { section: sectionService, lesson: lessonService, quiz: quizService };
    setBusy(true);
    setDeleteError('');
    try {
      await services[pendingDelete.kind].remove(pendingDelete.id);
      setMessage({ tone: 'success', text: `${pendingDelete.label} deleted.` });
      setPendingDelete(null);
      reload();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteMessages = {
    section: 'The section and all of its lessons will be deleted. Its quizzes become course-level quizzes. Student progress is recalculated.',
    lesson: 'The lesson will be deleted and student progress recalculated.',
    quiz: 'The quiz and all student attempts for it will be permanently deleted.',
  };

  return (
    <>
      <PageHeader
        eyebrow="Curriculum builder"
        title={course.title}
        subtitle={`${pluralize(sections.length, 'section')} · ${pluralize(curriculum.totalLessons, 'lesson')} · ${pluralize(curriculum.totalQuizzes, 'quiz', 'quizzes')} · ${formatDuration(curriculum.totalDuration)}`}
        actions={
          <>
            <Button to={`/courses/${course._id}`} variant="ghost" icon={ExternalLink}>
              Preview
            </Button>
            <Button to={`/instructor/courses/${course._id}/edit`} variant="outline" icon={Pencil}>
              Edit details
            </Button>
            <Button to={`/instructor/courses/${course._id}/students`} variant="outline" icon={Users}>
              Students
            </Button>
          </>
        }
      />
      <CourseSteps current="curriculum" courseId={course._id} />
      <Alert tone={message?.tone} onClose={() => setMessage(null)}>
        {message?.text}
      </Alert>

      <section id="publish" className={`card publish-panel ${course.published ? 'is-live' : ''}`}>
        <div>
          <div className="publish-title">
            <h2>Publishing</h2>
            <StatusBadge status={course.published ? 'published' : 'draft'} />
          </div>
          <p className="muted">
            {course.published
              ? 'This course is live in the catalog. Unpublishing hides it from new students; enrolled students keep access.'
              : curriculum.totalLessons === 0
                ? 'Add at least one lesson before publishing.'
                : 'When you’re ready, publish the course so students can find and enroll in it.'}
          </p>
        </div>
        <Button
          variant={course.published ? 'outline' : 'primary'}
          icon={course.published ? EyeOff : Eye}
          onClick={togglePublish}
          disabled={busy || (!course.published && curriculum.totalLessons === 0)}
        >
          {course.published ? 'Unpublish' : 'Publish course'}
        </Button>
      </section>

      {sections.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No sections yet"
          message="Sections group your lessons into chapters. Add your first section to start building the curriculum."
          action={
            <Button icon={Plus} onClick={() => setModal({ type: 'section' })}>
              Add first section
            </Button>
          }
        />
      ) : (
        <div className="curriculum">
          {sections.map((section, sIndex) => (
            <section key={section._id} className="card curriculum-section">
              <header className="curriculum-section-head">
                <div>
                  <p className="eyebrow">Section {sIndex + 1}</p>
                  <h3>{section.title}</h3>
                </div>
                <div className="row-actions">
                  <Button size="sm" variant="ghost" icon={ArrowUp} disabled={busy || sIndex === 0} onClick={() => reorderSections(sIndex, -1)} aria-label="Move section up" />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={ArrowDown}
                    disabled={busy || sIndex === sections.length - 1}
                    onClick={() => reorderSections(sIndex, 1)}
                    aria-label="Move section down"
                  />
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setModal({ type: 'section', section })} aria-label="Rename section" />
                  <Button
                    size="sm"
                    variant="ghost-danger"
                    icon={Trash2}
                    onClick={() => setPendingDelete({ kind: 'section', id: section._id, label: `Section “${section.title}”` })}
                    aria-label="Delete section"
                  />
                </div>
              </header>

              {section.lessons.length === 0 && section.quizzes.length === 0 ? (
                <p className="muted small curriculum-empty">No lessons in this section yet.</p>
              ) : (
                <ul className="curriculum-list">
                  {section.lessons.map((lesson, lIndex) => (
                    <li key={lesson._id} className="curriculum-row">
                      <PlayCircle size={18} aria-hidden="true" />
                      <div className="curriculum-row-body">
                        <span className="curriculum-row-title">
                          {lIndex + 1}. {lesson.title}
                        </span>
                        <span className="muted small">
                          {formatDuration(lesson.duration)} ·{' '}
                          <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">
                            video link
                          </a>
                        </span>
                      </div>
                      <div className="row-actions">
                        <Button size="sm" variant="ghost" icon={ArrowUp} disabled={busy || lIndex === 0} onClick={() => reorderLessons(section, lIndex, -1)} aria-label="Move lesson up" />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={ArrowDown}
                          disabled={busy || lIndex === section.lessons.length - 1}
                          onClick={() => reorderLessons(section, lIndex, 1)}
                          aria-label="Move lesson down"
                        />
                        <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setModal({ type: 'lesson', lesson, section })} aria-label={`Edit ${lesson.title}`} />
                        <Button
                          size="sm"
                          variant="ghost-danger"
                          icon={Trash2}
                          onClick={() => setPendingDelete({ kind: 'lesson', id: lesson._id, label: `Lesson “${lesson.title}”` })}
                          aria-label={`Delete ${lesson.title}`}
                        />
                      </div>
                    </li>
                  ))}
                  {section.quizzes.map((quiz) => (
                    <QuizRow
                      key={quiz._id}
                      quiz={quiz}
                      onEdit={() => setModal({ type: 'quiz', quizId: quiz._id })}
                      onDelete={() => setPendingDelete({ kind: 'quiz', id: quiz._id, label: `Quiz “${quiz.title}”` })}
                    />
                  ))}
                </ul>
              )}

              <footer className="curriculum-section-foot">
                <Button size="sm" variant="outline" icon={Plus} onClick={() => setModal({ type: 'lesson', section })}>
                  Add lesson
                </Button>
                <Button size="sm" variant="ghost" icon={ClipboardCheck} onClick={() => setModal({ type: 'quiz', defaultSection: section._id })}>
                  Add quiz
                </Button>
              </footer>
            </section>
          ))}

          <Button variant="outline" icon={Plus} onClick={() => setModal({ type: 'section' })} className="add-section-btn">
            Add section
          </Button>
        </div>
      )}

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Course-level quizzes</h2>
            <p className="muted small">Quizzes not tied to a specific section, such as a final exam.</p>
          </div>
          <Button size="sm" variant="outline" icon={Plus} onClick={() => setModal({ type: 'quiz' })}>
            Add quiz
          </Button>
        </div>
        {curriculum.quizzes.length === 0 ? (
          <p className="muted small">No course-level quizzes.</p>
        ) : (
          <ul className="curriculum-list">
            {curriculum.quizzes.map((quiz) => (
              <QuizRow
                key={quiz._id}
                quiz={quiz}
                onEdit={() => setModal({ type: 'quiz', quizId: quiz._id })}
                onDelete={() => setPendingDelete({ kind: 'quiz', id: quiz._id, label: `Quiz “${quiz.title}”` })}
              />
            ))}
          </ul>
        )}
      </section>

      {modal?.type === 'section' && (
        <SectionFormModal
          section={modal.section}
          onClose={closeModal}
          onSubmit={async (payload) => {
            if (modal.section) await sectionService.update(modal.section._id, payload);
            else await sectionService.create(course._id, payload);
            afterSave(modal.section ? 'Section renamed.' : 'Section added.');
          }}
        />
      )}

      {modal?.type === 'lesson' && (
        <LessonFormModal
          lesson={modal.lesson}
          sectionTitle={modal.section?.title}
          onClose={closeModal}
          onSubmit={async (payload) => {
            if (modal.lesson) await lessonService.update(modal.lesson._id, payload);
            else await lessonService.create(modal.section._id, payload);
            afterSave(modal.lesson ? 'Lesson updated.' : 'Lesson added.');
          }}
        />
      )}

      {modal?.type === 'quiz' && (
        <QuizEditorModal
          quizId={modal.quizId}
          courseId={course._id}
          sections={sections}
          defaultSection={modal.defaultSection}
          onClose={closeModal}
          onSaved={() => afterSave(modal.quizId ? 'Quiz updated.' : 'Quiz created.')}
        />
      )}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.kind}?`}
        message={pendingDelete && deleteMessages[pendingDelete.kind]}
        confirmLabel="Delete"
        loading={busy}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => {
          setPendingDelete(null);
          setDeleteError('');
        }}
      />
    </>
  );
}
