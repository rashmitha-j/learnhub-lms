import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Code2,
  Database,
  Brain,
  Globe,
  LineChart,
  Search,
  Shapes,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import CourseGrid from '../../components/course/CourseGrid';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import useApi from '../../hooks/useApi';
import useAuth from '../../hooks/useAuth';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { courseService } from '../../services/courseService';
import { CATEGORIES, homePathFor } from '../../utils/constants';

const CATEGORY_ICONS = {
  'Web Development': Globe,
  'Data Science': LineChart,
  Programming: Code2,
  'AI/ML': Brain,
  Database: Database,
  Cloud: Cloud,
  Other: Shapes,
};

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Structured courses',
    text: 'Courses are organized into sections and lessons so you always know what comes next.',
  },
  {
    icon: BarChart3,
    title: 'Track your progress',
    text: 'Mark lessons complete and resume exactly where you left off.',
  },
  {
    icon: ClipboardCheck,
    title: 'Quizzes with instant results',
    text: 'Check your understanding with quizzes scored instantly, with a full answer review.',
  },
  {
    icon: Award,
    title: 'Teach what you know',
    text: 'Instructors build curriculum, publish courses and follow each student’s progress.',
  },
];

export default function HomePage() {
  useDocumentTitle();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const featured = useApi(() => courseService.list({ limit: 6 }), []);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/courses?search=${encodeURIComponent(query)}` : '/courses');
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Online learning platform</p>
            <h1>Learn new skills, one lesson at a time.</h1>
            <p className="hero-text">
              Browse courses from expert instructors, enroll for free, and track your progress as you learn.
            </p>
            <form className="hero-search" onSubmit={handleSearch} role="search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="What do you want to learn?"
                aria-label="Search courses"
              />
              <Button type="submit">Search</Button>
            </form>
            <ul className="hero-points">
              <li>
                <CheckCircle2 size={16} aria-hidden="true" /> Free to enroll
              </li>
              <li>
                <CheckCircle2 size={16} aria-hidden="true" /> Learn at your pace
              </li>
              <li>
                <CheckCircle2 size={16} aria-hidden="true" /> Quizzes & progress tracking
              </li>
            </ul>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-card hero-card-main">
              <p className="hero-card-label">Continue learning</p>
              <p className="hero-card-title">React for Beginners</p>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '68%' }} />
              </div>
              <p className="hero-card-meta">8 of 12 lessons · 68%</p>
            </div>
            <div className="hero-card hero-card-float">
              <Award size={20} />
              <div>
                <p className="hero-card-title">Quiz passed</p>
                <p className="hero-card-meta">Score 90%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Explore categories</h2>
              <p className="muted">Find the right course for where you are and where you want to go.</p>
            </div>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category] || Shapes;
              return (
                <button
                  key={category}
                  type="button"
                  className="category-tile"
                  onClick={() => navigate(`/courses?category=${encodeURIComponent(category)}`)}
                >
                  <Icon size={22} aria-hidden="true" />
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Latest courses</h2>
              <p className="muted">Freshly published by our instructors.</p>
            </div>
            <Button to="/courses" variant="outline">
              View all courses
            </Button>
          </div>
          {featured.loading && !featured.data ? (
            <LoadingSpinner label="Loading courses…" />
          ) : featured.error ? (
            <ErrorMessage message={featured.error} onRetry={featured.reload} />
          ) : featured.data.courses.length === 0 ? (
            <EmptyState title="No courses yet" message="Check back soon — new courses are on the way." />
          ) : (
            <CourseGrid courses={featured.data.courses} />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Everything you need to learn and teach</h2>
          <div className="feature-grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="card feature-card">
                <span className="feature-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p className="muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>{user ? 'Pick up where you left off' : 'Ready to start learning?'}</h2>
              <p>
                {user
                  ? 'Head to your dashboard to continue your courses.'
                  : 'Create a free account as a student, or as an instructor to publish your own courses.'}
              </p>
            </div>
            <Button to={user ? homePathFor(user) : '/register'} variant="light" size="lg">
              {user ? 'Go to dashboard' : 'Create free account'}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
