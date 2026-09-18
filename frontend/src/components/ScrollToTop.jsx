import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Returns the viewport to the top whenever the route path changes, so opening a
// footer link or navigating to a new page starts at the top rather than keeping
// the previous scroll position. Search-only changes keep their position because
// the pathname does not change.
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
