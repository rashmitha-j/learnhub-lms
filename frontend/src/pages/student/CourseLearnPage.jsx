import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Lock,
  PlayCircle,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import ProgressBar from '../../components/ui/ProgressBar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../api/client';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { formatDuration, pluralize } from '../../utils/format';
import { getEmbedUrl } from '../../utils/video';

function LessonPlayer({ lesson }) {
  const embedUrl = getEmbedUrl(lesson.videoUrl);

  if (embedUrl) {
    return (
      <div className="player">
        <iframe
          key={lesson._id}
          src={embedUrl}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="player player-external">
      <PlayCircle size={48} aria-hidden="true" />
      <p>This lesson’s video is hosted on an external site.</p>
      <Button href={lesson.videoUrl} icon={ExternalLink} variant="light">
        Open video
      </Button>
    </div>
  );
}

export default function CourseLearnPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [completing, setCompleting] = useState(false);
  const [actionError, setActionError] = useState('');
  const { data, loading, error, status, reload, setData } = useApi(() => courseService.content(id), [id]);
  useDocumentTitle(data?.course.title || 'Learning');

  const lessons = useMemo(
    () =>
      data?.curriculum.sections.flatMap((section) =>
        section.lessons.map((lesson) => ({ ...lesson, sectionTitle: section.title }))
      ) ?? [],
    [data]
  );

  if (loading && !data) return <LoadingSpinner fullPage label="Loading course…" />;

  if (error) {
    const notEnrolled = status === 403;
    return (
      <div className="container page">
        <ErrorMessage
          title={notEnrolled ? 'You’re not enrolled in this course' : status === 404 ? 'Course not found' : 'Could not load course'}
          message={notEnrolled ? 'Enroll from the course page to start learning.' : error}
          onRetry={notEnrolled || status === 404 ? undefined : reload}
          action={
            <Button to={notEnrolled ? `/courses/${id}` : '/student/courses'} variant="primary">
              {notEnrolled ? 'View course' : 'My courses'}
            </Button>
          }
        />
      </div>
    );
  }

  const { course, curriculum, enrollment } = data;
  const completedSet = new Set((enrollment?.completedLessons || []).map(String));

  // Resume: explicit ?lesson=, else first incomplete lesson, else the last one completed
  const requested = lessons.find((l) => l._id === params.get('lesson'));
  const current =
    requested ||
    lessons.find((l) => !completedSet.has(l._id)) ||
    lessons.find((l) => l._id === String(enrollment?.lastLesson)) ||
    lessons[0];
  const currentIndex = current ? lessons.indexOf(current) : -1;
  const prev = lessons[currentIndex - 1];
  const next = lessons[currentIndex + 1];
  const isCurrentComplete = current && completedSet.has(current._id);

  const openLesson = (lessonId) => {
    setActionError('');
    setParams({ lesson: lessonId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const markComplete = async () => {
    setCompleting(true);
    setActionError('');
    try {
      const result = await enrollmentService.completeLesson(course._id, current._id);
      // Stay on this lesson (otherwise "first incomplete" would jump ahead); Next is highlighted
      setParams({ lesson: current._id }, { replace: true });
      setData((prevData) => ({ ...prevData, enrollment: result.enrollment }));
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setCompleting(false);
    }
  };

  const completedCount = completedSet.size;

  return (
    <div className="learn-page">
      <div className="learn-topbar">
        <div className="container learn-topbar-inner">
          <div className="learn-topbar-title">
            <Link to="/student/courses" className="link-muted back-link">
              <ArrowLeft size={16} aria-hidden="true" /> My courses
            </Link>
            <h1>{course.title}</h1>
          </div>
          <div className="learn-topbar-progress">
            <ProgressBar
              value={enrollment?.progress ?? 0}
              label={`${completedCount} of ${pluralize(curriculum.totalLessons, 'lesson')} completed`}
            />
          </div>
        </div>
      </div>

      <div className="container learn-layout">
        <div className="learn-main">
          {enrollment?.completed && (
            <div className="completion-banner">
              <Award size={28} aria-hidden="true" />
              <div>
                <strong>Congratulations — you completed this course!</strong>
                <p>You can keep reviewing lessons and retaking quizzes at any time.</p>
              </div>
            </div>
          )}

          {!current ? (
            <EmptyState icon={PlayCircle} title="No lessons yet" message="The instructor hasn’t added lessons to this course yet." />
          ) : (
            <>
              <LessonPlayer lesson={current} />
              <div className="lesson-header">
                <div>
                  <p className="eyebrow">
                    Lesson {currentIndex + 1} of {lessons.length} · {current.sectionTitle}
                  </p>
                  <h2>{current.title}</h2>
                  <p className="muted small lesson-meta">
                    <Clock size={14} aria-hidden="true" /> {formatDuration(current.duration)}
                  </p>
                </div>
                {isCurrentComplete ? (
                  <span className="lesson-done">
                    <CheckCircle2 size={18} aria-hidden="true" /> Completed
                  </span>
                ) : (
                  <Button onClick={markComplete} loading={completing} icon={CheckCircle2}>
                    Mark as complete
                  </Button>
                )}
              </div>
              <Alert tone="error">{actionError}</Alert>
              {current.description && <p className="lesson-description">{current.description}</p>}
              <div className="lesson-nav">
                <Button variant="outline" icon={ChevronLeft} disabled={!prev} onClick={() => prev && openLesson(prev._id)}>
                  Previous
                </Button>
                <Button
                  variant={isCurrentComplete ? 'primary' : 'outline'}
                  disabled={!next}
                  onClick={() => next && openLesson(next._id)}
                >
                  Next lesson <ChevronRight size={17} aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
        </div>

        <aside className="learn-sidebar" aria-label="Course content">
          <h2 className="learn-sidebar-title">Course content</h2>
          {curriculum.sections.map((section) => {
            const done = section.lessons.filter((l) => completedSet.has(l._id)).length;
            return (
              <details key={section._id} className="learn-section" open>
                <summary>
                  <span>{section.title}</span>
                  <span className="muted small">
                    {done}/{section.lessons.length}
                  </span>
                </summary>
                <ul>
                  {section.lessons.map((lesson) => {
                    const complete = completedSet.has(lesson._id);
                    const active = current?._id === lesson._id;
                    return (
                      <li key={lesson._id}>
                        <button
                          type="button"
                          className={`learn-item ${active ? 'active' : ''}`}
                          onClick={() => openLesson(lesson._id)}
                          aria-current={active ? 'true' : undefined}
                        >
                          {complete ? (
                            <CheckCircle2 size={18} className="text-success" aria-label="Completed" />
                          ) : (
                            <Circle size={18} className="muted" aria-label="Not completed" />
                          )}
                          <span className="learn-item-title">{lesson.title}</span>
                          <span className="muted small">{formatDuration(lesson.duration)}</span>
                        </button>
                      </li>
                    );
                  })}
                  {section.quizzes.map((quiz) => (
                    <li key={quiz._id}>
                      <Link to={`/student/quizzes/${quiz._id}`} className="learn-item learn-quiz">
                        <ClipboardCheck size={18} aria-hidden="true" />
                        <span className="learn-item-title">{quiz.title}</span>
                        <span className="muted small">{pluralize(quiz.questionCount, 'question')}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
          {curriculum.quizzes.length > 0 && (
            <div className="learn-section learn-section-static">
              <p className="learn-section-label">Course quizzes</p>
              <ul>
                {curriculum.quizzes.map((quiz) => (
                  <li key={quiz._id}>
                    <Link to={`/student/quizzes/${quiz._id}`} className="learn-item learn-quiz">
                      <ClipboardCheck size={18} aria-hidden="true" />
                      <span className="learn-item-title">{quiz.title}</span>
                      <span className="muted small">{pluralize(quiz.questionCount, 'question')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {curriculum.sections.length === 0 && (
            <p className="muted small learn-empty">
              <Lock size={14} aria-hidden="true" /> Content coming soon.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
