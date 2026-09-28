import CourseCard from './CourseCard';

// Responsive grid of course cards. `renderFooter(course)` adds per-card footer content.
export default function CourseGrid({ courses, renderFooter, getLink }) {
  return (
    <div className="course-grid">
      {courses.map((course) => (
        <CourseCard key={course._id} course={course} to={getLink?.(course)}>
          {renderFooter?.(course)}
        </CourseCard>
      ))}
    </div>
  );
}
