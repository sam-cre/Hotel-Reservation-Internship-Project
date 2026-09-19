import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { SelectField } from '../../components/ui/Field.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { apiMessage, reservationApi } from '../../services/api.js';
import { money, shortDate } from './customer-utils.js';
import styles from './Customer.module.css';

export function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [reload, setReload] = useState(0);
  const [state, setState] = useState({ loading: true, error: '' });
  const [sortBy, setSortBy] = useState('arrival-asc');

  useEffect(() => {
    const controller = new AbortController();
    reservationApi
      .mine(controller.signal)
      .then((records) => {
        setReservations(records);
        setState({ loading: false, error: '' });
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED')
          setState({
            loading: false,
            error: apiMessage(error, 'We could not load your reservations.'),
          });
      });
    return () => controller.abort();
  }, [reload]);

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => {
      switch (sortBy) {
        case 'arrival-desc':
          return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();
        case 'price-desc':
          return Number(b.totalPrice) - Number(a.totalPrice);
        case 'price-asc':
          return Number(a.totalPrice) - Number(b.totalPrice);
        case 'hotel-asc':
          return (a.hotel?.name || '').localeCompare(b.hotel?.name || '');
        case 'arrival-asc':
        default:
          return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
      }
    });
  }, [reservations, sortBy]);

  return (
    <main id="main-content" className={styles.main}>
      <section className={styles.reservationsPage}>
        <div className={styles.reservationsHeader}>
          <div className={styles.sectionHeading}>
            <p className={styles.kicker}>Your Stillwater account</p>
            <h1>My reservations.</h1>
            <p className={styles.muted}>
              Every current and previous stay connected to this account.
            </p>
          </div>
          {!state.loading && !state.error && reservations.length > 0 && (
            <div className={styles.reservationsSort}>
              <SelectField
                label="Sort by"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="arrival-asc">Arrival: earliest first</option>
                <option value="arrival-desc">Arrival: latest first</option>
                <option value="price-desc">Total: high to low</option>
                <option value="price-asc">Total: low to high</option>
                <option value="hotel-asc">Hotel name: A to Z</option>
              </SelectField>
            </div>
          )}
        </div>
        {state.loading && (
          <div className={styles.statePanel} aria-live="polite">
            <h2>Retrieving your stays.</h2>
            <p>Your reservation history will appear here.</p>
          </div>
        )}
        {state.error && (
          <div className={styles.statePanel} role="alert">
            <h2>Please sign in to view your reservations.</h2>
            <p>{state.error}</p>
            <div className={styles.statePanelActions}>
              <Link
                className={styles.primaryLink}
                to="/login?returnTo=%2Freservations"
              >
                Sign in
              </Link>
              <Button
                variant="secondary"
                onClick={() => {
                  setState({ loading: true, error: '' });
                  setReload((value) => value + 1);
                }}
              >
                <RefreshCw size={17} aria-hidden="true" />
                Try again
              </Button>
            </div>
          </div>
        )}
        {!state.loading && !state.error && reservations.length === 0 && (
          <div className={styles.statePanel}>
            <h2>Your first stay starts here.</h2>
            <p>You have no reservations on this account.</p>
            <Link className={styles.primaryLink} to="/">
              Find a hotel
            </Link>
          </div>
        )}
        {!state.loading && !state.error && reservations.length > 0 && (
          <div className={styles.reservationList}>
            {sortedReservations.map((reservation) => (
              <article key={reservation.id} className={styles.reservationRow}>
                <div>
                  <p className={styles.reservationReference}>
                    Reservation {reservation.id}
                  </p>
                  <h2>{reservation.hotel.name}</h2>
                  <p>
                    {reservation.room.name} in {reservation.hotel.city}
                  </p>
                </div>
                <dl>
                  <div>
                    <dt>Arrival</dt>
                    <dd>{shortDate(reservation.checkIn)}</dd>
                  </div>
                  <div>
                    <dt>Departure</dt>
                    <dd>{shortDate(reservation.checkOut)}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{money(reservation.totalPrice)}</dd>
                  </div>
                </dl>
                <div className={styles.reservationStatus}>
                  <StatusBadge status={reservation.status} />
                  <Link to={`/reservations/${reservation.id}`}>
                    View details <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
