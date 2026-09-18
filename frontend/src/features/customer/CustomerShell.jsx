import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Brand } from '../../components/Brand.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from './useAuth.js';
import styles from './Customer.module.css';

const COOKIE_KEY = 'stillwater-cookie-choice';

function savedCookieChoice() {
  try {
    return window.localStorage.getItem(COOKIE_KEY);
  } catch {
    return null;
  }
}

export function CustomerShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(() => !savedCookieChoice());
  const [cookieStatus, setCookieStatus] = useState('');

  async function signOut() {
    await logout();
    setMenuOpen(false);
    navigate('/');
  }

  function chooseCookies(choice) {
    try {
      window.localStorage.setItem(COOKIE_KEY, choice);
    } catch {
      // The preference remains active for this page view if storage is unavailable.
    }
    setCookiesOpen(false);
    setCookieStatus(
      choice === 'optional'
        ? 'Optional cookies allowed. No optional service is currently connected.'
        : 'Only essential storage is allowed.',
    );
  }

  return (
    <>
      <a className="skipLink" href="#main-content">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Brand />
          <button
            className={styles.menuButton}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="srOnly">
              {menuOpen ? 'Close menu' : 'Open menu'}
            </span>
          </button>
          <nav
            id="main-navigation"
            className={menuOpen ? styles.navOpen : ''}
            aria-label="Main navigation"
          >
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>
              Find a hotel
            </NavLink>
            {user && (
              <NavLink to="/reservations" onClick={() => setMenuOpen(false)}>
                My reservations
              </NavLink>
            )}
            {user ? (
              <button type="button" onClick={signOut}>
                Sign out
              </button>
            ) : (
              <NavLink to="/login" onClick={() => setMenuOpen(false)}>
                Sign in
              </NavLink>
            )}
          </nav>
          <Link className={styles.headerAction} to="/#stay-search">
            Book a stay <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </header>
      {children}
      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <div className={styles.footerIdentity}>
            <Brand />
            <p>Book hotels in select cities.</p>
          </div>
          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore">Explore</h2>
            <Link to="/">Find a hotel</Link>
            <Link to="/reservations">My reservations</Link>
          </nav>
          <nav aria-labelledby="footer-support">
            <h2 id="footer-support">Guest support</h2>
            <Link to="/information/contact">Contact</Link>
            <Link to="/information/accessibility">Accessibility</Link>
          </nav>
          <nav aria-labelledby="footer-legal">
            <h2 id="footer-legal">Legal</h2>
            <Link to="/information/privacy">Privacy</Link>
            <Link to="/information/terms">Reservation terms</Link>
            <button type="button" onClick={() => setCookiesOpen(true)}>
              Cookie preferences
            </button>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>&copy; {new Date().getFullYear()} Stillwater Hotels</span>
          <span>Rooms and rates are subject to availability.</span>
        </div>
      </footer>
      <p className="srOnly" role="status">
        {cookieStatus}
      </p>
      {cookiesOpen && (
        <section className={styles.cookieBanner} aria-labelledby="cookie-title">
          <div>
            <h2 id="cookie-title">Your privacy choices</h2>
            <p>
              Essential storage keeps your sign-in and privacy choice working.
              Optional services remain off unless you allow them. No analytics
              service is currently connected.
            </p>
          </div>
          <div className={styles.cookieActions}>
            <Button
              variant="secondary"
              onClick={() => chooseCookies('essential')}
            >
              Use essential only
            </Button>
            <Button onClick={() => chooseCookies('optional')}>
              Allow optional
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
