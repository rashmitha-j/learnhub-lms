import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrolls to the top when the path changes (query-string changes keep the position).
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
