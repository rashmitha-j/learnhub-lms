import { Link } from 'react-router-dom';
import { Clock, PlayCircle, Users } from 'lucide-react';
import CourseThumbnail from './CourseThumbnail';
import { formatDuration, pluralize } from '../../utils/format';

// Catalog card. `children` renders an optional footer (e.g. progress or actions).
export default function CourseCard({ course, to = `/courses/${course._id}`, children }) {
  return (
    <article className="course-card">
      <Link to={to} className="course-card-media" tabIndex={-1} aria-hidden="true">
        <CourseThumbnail src={course.thumbnail} title={course.title} />
        <span className="course-card-level">{course.level}</span>
      </Link>
      <div className="course-card-body">
        <p className="course-card-category">{course.category}</p>
        <h3 className="course-card-title">
          <Link to={to}>{course.title}</Link>
        </h3>
        {course.instructor?.name && <p className="course-card-instructor">by {course.instructor.name}</p>}
        {course.lessonCount !== undefined && (
          <ul className="course-card-meta">
            <li>
              <PlayCircle size={15} aria-hidden="true" /> {pluralize(course.lessonCount, 'lesson')}
            </li>
            <li>
              <Clock size={15} aria-hidden="true" /> {formatDuration(course.totalDuration)}
            </li>
            <li>
              <Users size={15} aria-hidden="true" /> {course.studentCount}
            </li>
          </ul>
        )}
        {children && <div className="course-card-footer">{children}</div>}
      </div>
    </article>
  );
}
