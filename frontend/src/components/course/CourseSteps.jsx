import { Link } from 'react-router-dom';

const STEPS = [
  { key: 'details', label: 'Course details', path: (id) => (id ? `/instructor/courses/${id}/edit` : null) },
  { key: 'curriculum', label: 'Curriculum & quizzes', path: (id) => (id ? `/instructor/courses/${id}/curriculum` : null) },
  { key: 'publish', label: 'Publish', path: (id) => (id ? `/instructor/courses/${id}/curriculum#publish` : null) },
];

// Step indicator for the course builder: details -> curriculum -> publish.
export default function CourseSteps({ current, courseId }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="steps">
      {STEPS.map((step, index) => {
        const href = step.path(courseId);
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
        const content = (
          <>
            <span className="step-number">{index + 1}</span>
            <span className="step-label">{step.label}</span>
          </>
        );
        return (
          <li key={step.key} className={`step step-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            {href && state !== 'current' ? <Link to={href}>{content}</Link> : <span>{content}</span>}
          </li>
        );
      })}
    </ol>
  );
}
