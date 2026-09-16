import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { ButtonLink } from '../../components/ui/Button.jsx';
import { Brand } from '../../components/Brand.jsx';
import { useAuth } from '../customer/useAuth.js';
import { AdminShell } from './AdminShell.jsx';
import { HotelsAdminPage } from './HotelsAdminPage.jsx';
import { ReservationsAdminPage } from './ReservationsAdminPage.jsx';
import styles from './Admin.module.css';

function AccessPage({ title, children }) {
  return (
    <main id="main-content" className={styles.accessPage}>
      <Brand />
      <div>
        <p className={styles.kicker}>Stillwater operations</p>
        <h1>{title}</h1>
        <p>{children}</p>
        <ButtonLink to="/">Return to the guest site</ButtonLink>
      </div>
    </main>
  );
}

export function AdminApplication() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const adminTitle = location.pathname.endsWith('/hotels')
    ? 'Hotels and rooms'
    : 'Reservations';
  useDocumentTitle(`Operations: ${adminTitle}`);

  if (loading) {
    return (
      <AccessPage title="Opening the workspace">
        Verifying your administrator session.
      </AccessPage>
    );
  }
  if (!user) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }
  if (user.role !== 'admin') {
    return (
      <AccessPage title="Administrator access required">
        This account can manage personal reservations but cannot open hotel
        operations.
      </AccessPage>
    );
  }

  return (
    <AdminShell>
      <Routes>
        <Route index element={<Navigate to="reservations" replace />} />
        <Route path="reservations" element={<ReservationsAdminPage />} />
        <Route path="hotels" element={<HotelsAdminPage />} />
        <Route path="*" element={<Navigate to="reservations" replace />} />
      </Routes>
    </AdminShell>
  );
}
