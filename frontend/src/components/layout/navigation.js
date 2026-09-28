import { BookOpen, GraduationCap, LayoutDashboard, PlusCircle, User, Users } from 'lucide-react';

// Sidebar links per role
export const SIDEBAR_LINKS = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/courses', label: 'My Courses', icon: GraduationCap },
    { to: '/courses', label: 'Browse Courses', icon: BookOpen },
    { to: '/student/profile', label: 'Profile', icon: User },
  ],
  instructor: [
    { to: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/instructor/courses', label: 'My Courses', icon: BookOpen, end: true },
    { to: '/instructor/courses/create', label: 'Create Course', icon: PlusCircle },
    { to: '/instructor/profile', label: 'Profile', icon: User },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/enrollments', label: 'Enrollments', icon: GraduationCap },
  ],
};
