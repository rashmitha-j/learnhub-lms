import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function DashboardLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="container dashboard">
        <Sidebar />
        <main className="dashboard-main" id="main">
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
