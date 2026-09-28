import { Link } from 'react-router-dom';
import { BookOpen, ClipboardCheck, GraduationCap, Presentation, Shield, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { adminService } from '../../services/adminService';

const LINKS = [
  { to: '/admin/users', icon: Users, title: 'Users', text: 'Browse students, instructors and admins.' },
  { to: '/admin/courses', icon: BookOpen, title: 'Courses', text: 'Review all courses, publish, unpublish or delete.' },
  { to: '/admin/enrollments', icon: GraduationCap, title: 'Enrollments', text: 'See who is enrolled where and their progress.' },
];

export default function AdminDashboard() {
  useDocumentTitle('Admin');
  const { data, loading, error, reload } = useApi(() => adminService.stats(), []);

  if (loading && !data) return <LoadingSpinner label="Loading platform stats…" />;
  if (error) return <ErrorMessage title="Could not load stats" message={error} onRetry={reload} />;

  const { stats } = data;

  return (
    <>
      <PageHeader eyebrow="Administration" title="Admin dashboard" subtitle="A quick overview of the platform." />

      <div className="stat-grid">
        <StatCard icon={GraduationCap} label="Students" value={stats.users.student} tone="info" />
        <StatCard icon={Presentation} label="Instructors" value={stats.users.instructor} tone="purple" />
        <StatCard icon={Shield} label="Admins" value={stats.users.admin} tone="warning" />
        <StatCard
          icon={BookOpen}
          label="Courses"
          value={stats.totalCourses}
          hint={`${stats.publishedCourses} published · ${stats.draftCourses} drafts`}
        />
        <StatCard
          icon={Users}
          label="Enrollments"
          value={stats.totalEnrollments}
          hint={`${stats.completedEnrollments} completed`}
          tone="success"
        />
        <StatCard icon={ClipboardCheck} label="Quiz attempts" value={stats.quizAttempts} tone="warning" />
      </div>

      <div className="admin-links">
        {LINKS.map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="card admin-link">
            <span className="stat-icon tone-primary">
              <Icon size={20} aria-hidden="true" />
            </span>
            <div>
              <h2>{title}</h2>
              <p className="muted small">{text}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
