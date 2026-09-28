import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main" id="main">
        <Suspense fallback={<LoadingSpinner fullPage />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
