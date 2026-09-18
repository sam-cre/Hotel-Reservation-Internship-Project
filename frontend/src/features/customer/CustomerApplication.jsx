import {
  matchPath,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useAuth } from './useAuth.js';
import { CustomerShell } from './CustomerShell.jsx';
import { SearchPage } from './SearchPage.jsx';
import { HotelsDirectoryPage } from './HotelsDirectoryPage.jsx';
import { HotelPage } from './HotelPage.jsx';
import { AuthenticationPage } from './AuthenticationPage.jsx';
import { ReservationPage } from './ReservationPage.jsx';
import { ReservationsPage } from './ReservationsPage.jsx';
import { InformationPage } from './InformationPage.jsx';
import { ButtonLink } from '../../components/ui/Button.jsx';
import styles from './Customer.module.css';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingPage label="Restoring your session" />;
  if (!user) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }
  return children;
}

function LoadingPage({ label }) {
  return (
    <main id="main-content" className={styles.narrowPage} aria-busy="true">
      <p className={styles.kicker}>Stillwater Hotels</p>
      <h1>{label}</h1>
      <p className={styles.muted} role="status">
        One moment while we prepare your stay.
      </p>
    </main>
  );
}

function NotFound() {
  return (
    <main id="main-content" className={styles.narrowPage}>
      <p className={styles.kicker}>Stillwater Hotels</p>
      <h1>Page not found</h1>
      <p className={styles.muted}>This page is not part of the itinerary.</p>
      <ButtonLink to="/">Return to hotel search</ButtonLink>
    </main>
  );
}

const CUSTOMER_TITLES = [
  ['/', 'Find your stay'],
  ['/search', 'Search hotels'],
  ['/hotels', 'Our hotels'],
  ['/hotels/:hotelId', 'Hotel details'],
  ['/login', 'Sign in'],
  ['/register', 'Create your account'],
  ['/reserve', 'Review your stay'],
  ['/reservations', 'Your reservations'],
  ['/reservations/:reservationId', 'Reservation confirmed'],
  ['/information/:topic', 'Guest information'],
];

function resolveCustomerTitle(pathname) {
  for (const [pattern, title] of CUSTOMER_TITLES) {
    if (matchPath({ path: pattern, end: true }, pathname)) return title;
  }
  return null;
}

export function CustomerApplication() {
  const location = useLocation();
  useDocumentTitle(resolveCustomerTitle(location.pathname));
  return (
    <CustomerShell>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/hotels" element={<HotelsDirectoryPage />} />
        <Route path="/hotels/:hotelId" element={<HotelPage />} />
        <Route path="/login" element={<AuthenticationPage mode="login" />} />
        <Route
          path="/register"
          element={<AuthenticationPage mode="register" />}
        />
        <Route
          path="/reserve"
          element={
            <Protected>
              <ReservationPage />
            </Protected>
          }
        />
        <Route
          path="/reservations"
          element={
            <Protected>
              <ReservationsPage />
            </Protected>
          }
        />
        <Route
          path="/reservations/:reservationId"
          element={
            <Protected>
              <ReservationPage confirmation />
            </Protected>
          }
        />
        <Route path="/information/:topic" element={<InformationPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </CustomerShell>
  );
}
