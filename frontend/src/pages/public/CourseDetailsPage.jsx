import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BarChart,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Lock,
  PlayCircle,
  Settings,
  Users,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Avatar from '../../components/ui/Avatar';
import CourseThumbnail from '../../components/course/CourseThumbnail';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import useApi from '../../hooks/useApi';
import useAuth from '../../hooks/useAuth';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../api/client';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { formatDuration, pluralize } from '../../utils/format';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Refetch when the user changes so enrollment status is correct after login
  const { data, loading, error, status, reload } = useApi(() => courseService.get(id), [id, user?._id]);
  useDocumentTitle(data?.course.title || 'Course');

  if (loading && !data) return <LoadingSpinner fullPage label="Loading course…" />;

  if (error) {
    return (
      <div className="container page">
        <ErrorMessage
          title={status === 404 || status === 400 ? 'Course not found' : 'Could not load course'}
          message={status === 404 || status === 400 ? 'This course does not exist or is not published.' : error}
          onRetry={status === 404 || status === 400 ? undefined : reload}
          action={<Button to="/courses">Browse courses</Button>}
        />
      </div>
    );
  }

  const { course, curriculum, enrollment, canManage } = data;
  const learnPath = `/student/courses/${course._id}/learn`;

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setEnrolling(true);
    setEnrollError('');
    try {
      await enrollmentService.enroll(course._id);
      navigate(learnPath);
    } catch (err) {
      if (err.response?.status === 409) navigate(learnPath);
      else setEnrollError(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  const renderAction = () => {
    if (canManage && user?.role === 'admin') {
      return (
        <Button to="/admin/courses" icon={Settings} block variant="outline">
          Manage in admin
        </Button>
      );
    }
    if (canManage) {
      return (
        <Button to={`/instructor/courses/${course._id}/curriculum`} icon={Settings} block>
          Manage course
        </Button>
      );
    }
    if (enrollment) {
      return (
        <>
          <ProgressBar value={enrollment.progress} label="Your progress" />
          <Button to={learnPath} icon={PlayCircle} block size="lg">
            {enrollment.completed ? 'Review course' : enrollment.progress > 0 ? 'Continue learning' : 'Start learning'}
          </Button>
        </>
      );
    }
    if (user && user.role !== 'student') {
      return <p className="muted small">Only student accounts can enroll in courses.</p>;
    }
    return (
      <Button onClick={handleEnroll} loading={enrolling} block size="lg">
        {user ? 'Enroll now — it’s free' : 'Log in to enroll'}
      </Button>
    );
  };

  return (
    <>
      <section className="course-hero">
        <div className="container course-hero-grid">
          <div className="course-hero-copy">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link to="/courses">Courses</Link>
              <span aria-hidden="true">/</span>
              <Link to={`/courses?category=${encodeURIComponent(course.category)}`}>{course.category}</Link>
            </nav>
            <h1>{course.title}</h1>
            <p className="course-hero-description">{course.description}</p>
            <div className="course-hero-badges">
              <StatusBadge tone="info">{course.level}</StatusBadge>
              {!course.published && <StatusBadge status="draft">Draft — only visible to you</StatusBadge>}
            </div>
            <ul className="course-hero-stats">
              <li>
                <PlayCircle size={16} aria-hidden="true" /> {pluralize(course.lessonCount, 'lesson')}
              </li>
              <li>
                <Clock size={16} aria-hidden="true" /> {formatDuration(course.totalDuration)} total
              </li>
              <li>
                <Users size={16} aria-hidden="true" /> {pluralize(course.studentCount, 'student')}
              </li>
            </ul>
            <p className="course-hero-instructor">
              Created by <strong>{course.instructor?.name}</strong>
            </p>
          </div>
        </div>
      </section>

      <div className="container course-layout">
        <div className="course-main">
          {course.learningOutcomes?.length > 0 && (
            <section className="card">
              <h2>What you’ll learn</h2>
              <ul className="check-list two-col">
                {course.learningOutcomes.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={18} aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <div className="curriculum-head">
              <h2>Course content</h2>
              <p className="muted small">
                {pluralize(curriculum.sections.length, 'section')} · {pluralize(curriculum.totalLessons, 'lesson')} ·{' '}
                {pluralize(curriculum.totalQuizzes, 'quiz', 'quizzes')} · {formatDuration(curriculum.totalDuration)}
              </p>
            </div>
            {curriculum.sections.length === 0 ? (
              <p className="muted">The curriculum for this course is being prepared.</p>
            ) : (
              <div className="accordion">
                {curriculum.sections.map((section, index) => (
                  <details key={section._id} className="accordion-item" open={index === 0}>
                    <summary>
                      <span className="accordion-title">{section.title}</span>
                      <span className="muted small">{pluralize(section.lessons.length, 'lesson')}</span>
                    </summary>
                    <ul className="lesson-list">
                      {section.lessons.map((lesson) => (
                        <li key={lesson._id}>
                          <PlayCircle size={16} aria-hidden="true" />
                          <span className="lesson-list-title">{lesson.title}</span>
                          <span className="muted small">{formatDuration(lesson.duration)}</span>
                          {!enrollment && !canManage && <Lock size={14} className="muted" aria-label="Locked" />}
                        </li>
                      ))}
                      {section.quizzes.map((quiz) => (
                        <li key={quiz._id}>
                          <ClipboardCheck size={16} aria-hidden="true" />
                          <span className="lesson-list-title">{quiz.title}</span>
                          <span className="muted small">{pluralize(quiz.questionCount, 'question')}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            )}
            {curriculum.quizzes.length > 0 && (
              <ul className="lesson-list lesson-list-standalone">
                {curriculum.quizzes.map((quiz) => (
                  <li key={quiz._id}>
                    <ClipboardCheck size={16} aria-hidden="true" />
                    <span className="lesson-list-title">{quiz.title}</span>
                    <span className="muted small">{pluralize(quiz.questionCount, 'question')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {course.requirements?.length > 0 && (
            <section className="card">
              <h2>Requirements</h2>
              <ul className="bullet-list">
                {course.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <h2>Your instructor</h2>
            <div className="instructor-box">
              <Avatar name={course.instructor?.name} size={56} />
              <div>
                <p className="instructor-name">{course.instructor?.name}</p>
                <p className="muted">{course.instructor?.bio || 'Instructor at LearnHub.'}</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="course-aside">
          <div className="card enroll-card">
            <CourseThumbnail src={course.thumbnail} title={course.title} className="enroll-thumb" />
            <div className="enroll-card-body">
              <p className="enroll-price">Free</p>
              <Alert tone="error">{enrollError}</Alert>
              {renderAction()}
              <ul className="enroll-includes">
                <li>
                  <PlayCircle size={16} aria-hidden="true" /> {pluralize(course.lessonCount, 'video lesson')}
                </li>
                <li>
                  <ClipboardCheck size={16} aria-hidden="true" /> {pluralize(curriculum.totalQuizzes, 'quiz', 'quizzes')}
                </li>
                <li>
                  <BarChart size={16} aria-hidden="true" /> Progress tracking
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
