import { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { adminApi, apiMessage } from '../../services/api.js';
import { FormNotice } from './AdminFields.jsx';
import { money } from './admin-utils.js';
import styles from './Admin.module.css';

// All figures are derived in the browser from the reservation register that the
// operations team already loads, so the dashboard needs no separate reporting
// endpoint. Confirmed reservations drive value and rate; cancelled ones are
// counted but excluded from revenue.
function summarize(reservations) {
  const confirmed = reservations.filter((item) => item.status === 'confirmed');
  const cancelled = reservations.filter((item) => item.status === 'cancelled');
  const grossValue = confirmed.reduce(
    (total, item) => total + Number(item.totalPrice),
    0,
  );
  const averageNightly = confirmed.length
    ? confirmed.reduce((total, item) => total + Number(item.pricePerNight), 0) /
      confirmed.length
    : 0;

  const perHotel = new Map();
  for (const item of confirmed) {
    perHotel.set(item.hotel.name, (perHotel.get(item.hotel.name) ?? 0) + 1);
  }
  const hotels = [...perHotel.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: reservations.length,
    confirmed: confirmed.length,
    cancelled: cancelled.length,
    grossValue,
    averageNightly,
    hotels,
    maxCount: hotels.length ? hotels[0].count : 0,
  };
}

export function AnalyticsAdminPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    adminApi
      .reservations('all', controller.signal)
      .then(setReservations)
      .catch((nextError) => {
        if (nextError.code !== 'ERR_CANCELED')
          setError(apiMessage(nextError, 'Analytics could not be loaded.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const stats = useMemo(() => summarize(reservations), [reservations]);

  const metrics = [
    { label: 'Total reservations', value: stats.total },
    { label: 'Confirmed', value: stats.confirmed },
    { label: 'Cancelled', value: stats.cancelled },
    { label: 'Confirmed booking value', value: money(stats.grossValue) },
    { label: 'Average nightly rate', value: money(stats.averageNightly) },
  ];

  return (
    <main id="admin-content" className={styles.main}>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.kicker}>Hotel operations</p>
          <h1>Analytics</h1>
          <p>A live summary of reservation activity across every property.</p>
        </div>
      </div>

      {error ? (
        <FormNotice error={error} />
      ) : loading ? (
        <p className={styles.loadingState} role="status">
          Loading reservation analytics.
        </p>
      ) : (
        <>
          <section className={styles.metricGrid} aria-label="Key figures">
            {metrics.map((metric) => (
              <div key={metric.label} className={styles.metric}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </section>

          <section className={styles.panel} aria-labelledby="by-hotel-title">
            <div className={styles.panelHeading}>
              <div>
                <h2 id="by-hotel-title">Confirmed bookings by hotel</h2>
                <span>{stats.confirmed} confirmed reservations</span>
              </div>
            </div>
            {stats.hotels.length ? (
              <ul className={styles.barList}>
                {stats.hotels.map((hotel) => (
                  <li key={hotel.name}>
                    <span className={styles.barLabel}>{hotel.name}</span>
                    <span className={styles.barTrack}>
                      <span
                        className={styles.barFill}
                        style={{
                          inlineSize: `${(hotel.count / stats.maxCount) * 100}%`,
                        }}
                      />
                    </span>
                    <span className={styles.barValue}>{hotel.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <BarChart3 size={28} aria-hidden="true" />
                <h3>No confirmed bookings yet</h3>
                <p>
                  Confirmed reservations will appear here as they are booked.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
