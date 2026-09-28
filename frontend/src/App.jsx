import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import RoleRoute from './components/routing/RoleRoute';
import GuestRoute from './components/routing/GuestRoute';
import ProtectedRoute from './components/routing/ProtectedRoute';
import RoleHomeRedirect from './components/routing/RoleHomeRedirect';
import HomePage from './pages/public/HomePage';
import { ROLES } from './utils/constants';

// Route-level code splitting: each area loads only when visited
const CoursesPage = lazy(() => import('./pages/public/CoursesPage'));
const CourseDetailsPage = lazy(() => import('./pages/public/CourseDetailsPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('./pages/public/UnauthorizedPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'));

const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const MyCoursesPage = lazy(() => import('./pages/student/MyCoursesPage'));
const CourseLearnPage = lazy(() => import('./pages/student/CourseLearnPage'));
const QuizPage = lazy(() => import('./pages/student/QuizPage'));
const QuizResultPage = lazy(() => import('./pages/student/QuizResultPage'));

const InstructorDashboard = lazy(() => import('./pages/instructor/InstructorDashboard'));
const InstructorCoursesPage = lazy(() => import('./pages/instructor/InstructorCoursesPage'));
const CourseFormPage = lazy(() => import('./pages/instructor/CourseFormPage'));
const CurriculumPage = lazy(() => import('./pages/instructor/CurriculumPage'));
const CourseStudentsPage = lazy(() => import('./pages/instructor/CourseStudentsPage'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage'));
const AdminEnrollmentsPage = lazy(() => import('./pages/admin/AdminEnrollmentsPage'));

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailsPage />} />
        <Route path="unauthorized" element={<UnauthorizedPage />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<RoleHomeRedirect />} />
        </Route>

        {/* Full-width learning page */}
        <Route element={<RoleRoute roles={[ROLES.STUDENT]} />}>
          <Route path="student/courses/:id/learn" element={<CourseLearnPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Student area */}
      <Route path="student" element={<RoleRoute roles={[ROLES.STUDENT]} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<MyCoursesPage />} />
          <Route path="quizzes/:id" element={<QuizPage />} />
          <Route path="quizzes/:id/result" element={<QuizResultPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Instructor area */}
      <Route path="instructor" element={<RoleRoute roles={[ROLES.INSTRUCTOR]} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="courses" element={<InstructorCoursesPage />} />
          <Route path="courses/create" element={<CourseFormPage />} />
          <Route path="courses/:id/edit" element={<CourseFormPage />} />
          <Route path="courses/:id/curriculum" element={<CurriculumPage />} />
          <Route path="courses/:id/students" element={<CourseStudentsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin area */}
      <Route path="admin" element={<RoleRoute roles={[ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="enrollments" element={<AdminEnrollmentsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
