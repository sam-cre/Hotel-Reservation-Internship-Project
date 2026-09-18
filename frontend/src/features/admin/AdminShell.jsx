import {
  BarChart3,
  Building2,
  CalendarDays,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Brand } from '../../components/Brand.jsx';
import { Button, ButtonLink } from '../../components/ui/Button.jsx';
import { useAuth } from '../customer/useAuth.js';
import { initials } from './admin-utils.js';
import styles from './Admin.module.css';

export function AdminShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await logout();
    navigate('/');
  }

  return (
    <>
      <a className="skipLink" href="#admin-content">
        Skip to workspace
      </a>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <Brand />
          <p className={styles.workspaceLabel}>Hotel operations</p>
          <nav aria-label="Administration" className={styles.navigation}>
            <NavLink
              to="/admin/reservations"
              className={({ isActive }) => (isActive ? styles.activeNav : '')}
            >
              <CalendarDays size={19} aria-hidden="true" />
              Reservations
            </NavLink>
            <NavLink
              to="/admin/hotels"
              className={({ isActive }) => (isActive ? styles.activeNav : '')}
            >
              <Building2 size={19} aria-hidden="true" />
              Hotels and rooms
            </NavLink>
            <NavLink
              to="/admin/analytics"
              className={({ isActive }) => (isActive ? styles.activeNav : '')}
            >
              <BarChart3 size={19} aria-hidden="true" />
              Analytics
            </NavLink>
          </nav>
          <div className={styles.sidebarBottom}>
            <span className={styles.accountMark} aria-hidden="true">
              {initials(user.name)}
            </span>
            <span className={styles.accountName}>
              {user.name}
              <small>Administrator</small>
            </span>
            <Button
              variant="quiet"
              onClick={signOut}
              aria-label="Sign out of administration"
            >
              <LogOut size={18} aria-hidden="true" />
            </Button>
          </div>
        </aside>
        <div className={styles.workspace}>
          <header className={styles.topbar}>
            <span>Stillwater operations</span>
            <ButtonLink to="/" variant="quiet">
              View guest site
              <ExternalLink size={16} aria-hidden="true" />
            </ButtonLink>
          </header>
          {children}
        </div>
      </div>
    </>
  );
}
