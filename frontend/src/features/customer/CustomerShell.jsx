import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu as MenuDropdown,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';
import {
  CalendarCheck,
  ChevronDown,
  LogOut,
  MapPin,
  Menu,
  X,
} from 'lucide-react';
import { Brand } from '../../components/Brand.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { catalogApi } from '../../services/api.js';
import { useAuth } from './useAuth.js';
import styles from './Customer.module.css';

function initialsOf(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'G';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

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
  const [cities, setCities] = useState([]);
  const [cookiesOpen, setCookiesOpen] = useState(() => !savedCookieChoice());
  const [cookieStatus, setCookieStatus] = useState('');

  // The Destinations menu lists the cities that actually have hotels, drawn
  // from the same public endpoint the search page uses. A failed lookup simply
  // leaves the menu out rather than showing an error in the header.
  useEffect(() => {
    const controller = new AbortController();
    catalogApi
      .hotels({}, controller.signal)
      .then((records) => {
        setCities([...new Set(records.map((hotel) => hotel.city))].sort());
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const closeMenu = () => setMenuOpen(false);

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
            <NavLink to="/" end onClick={closeMenu}>
              Find a hotel
            </NavLink>
            {cities.length > 0 && (
              <MenuDropdown as="div" className={styles.navDropdown}>
                <MenuButton className={styles.navMenuButton}>
                  Destinations
                  <ChevronDown size={15} aria-hidden="true" />
                </MenuButton>
                <MenuItems
                  className={styles.menuContent}
                  anchor={{ to: 'bottom start', gap: 10 }}
                  modal={false}
                >
                  {cities.map((city) => (
                    <MenuItem key={city}>
                      <Link
                        className={styles.menuItem}
                        to={`/search?city=${encodeURIComponent(city)}`}
                        onClick={closeMenu}
                      >
                        <MapPin size={16} aria-hidden="true" />
                        {city}
                      </Link>
                    </MenuItem>
                  ))}
                </MenuItems>
              </MenuDropdown>
            )}
            <NavLink to="/hotels" onClick={closeMenu}>
              Our hotels
            </NavLink>
            <NavLink to="/information/contact" onClick={closeMenu}>
              Help
            </NavLink>
            <div className={styles.navMobileAccount}>
              {user ? (
                <>
                  <NavLink
                    to="/reservations"
                    onClick={() => setMenuOpen(false)}
                  >
                    My reservations
                  </NavLink>
                  <button type="button" onClick={signOut}>
                    Sign out
                  </button>
                </>
              ) : (
                <NavLink to="/login" onClick={() => setMenuOpen(false)}>
                  Sign in
                </NavLink>
              )}
            </div>
          </nav>
          <div className={styles.account}>
            {user ? (
              <MenuDropdown>
                <MenuButton className={styles.profileButton}>
                  <span className={styles.avatar} aria-hidden="true">
                    {initialsOf(user.name)}
                  </span>
                  <span className={styles.profileName}>
                    {String(user.name || 'Guest').split(/\s+/)[0]}
                  </span>
                  <ChevronDown size={16} aria-hidden="true" />
                  <span className="srOnly">Account menu</span>
                </MenuButton>
                <MenuItems
                  className={styles.menuContent}
                  anchor={{ to: 'bottom end', gap: 10 }}
                  modal={false}
                >
                  <MenuItem>
                    <Link className={styles.menuItem} to="/reservations">
                      <CalendarCheck size={16} aria-hidden="true" />
                      My reservations
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <button
                      type="button"
                      className={styles.menuItem}
                      onClick={signOut}
                    >
                      <LogOut size={16} aria-hidden="true" />
                      Sign out
                    </button>
                  </MenuItem>
                </MenuItems>
              </MenuDropdown>
            ) : (
              <Link className={styles.headerAction} to="/login">
                Sign in
              </Link>
            )}
          </div>
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
              You control what this site stores. Here is exactly what each
              choice covers.
            </p>
            <dl className={styles.cookieDetails}>
              <div>
                <dt>
                  Essential
                  <span className={styles.cookieAlways}>Always on</span>
                </dt>
                <dd>
                  Keeps you signed in and remembers this privacy choice. Never
                  used to track you.
                </dd>
              </div>
              <div>
                <dt>
                  Analytics
                  <span className={styles.cookieOff}>Off</span>
                </dt>
                <dd>
                  Would measure anonymous page views to improve the site. No
                  analytics service is currently connected, so nothing is
                  collected even if you allow it.
                </dd>
              </div>
            </dl>
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
