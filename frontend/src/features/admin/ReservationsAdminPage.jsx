import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Field, SelectField } from '../../components/ui/Field.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { adminApi, apiMessage } from '../../services/api.js';
import { FormNotice } from './AdminFields.jsx';
import { initials, money, shortDate } from './admin-utils.js';
import styles from './Admin.module.css';

export function ReservationsAdminPage() {
  const [reservations, setReservations] = useState([]);
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    adminApi
      .reservations(status, controller.signal)
      .then(setReservations)
      .catch((nextError) => {
        if (nextError.code !== 'ERR_CANCELED')
          setError(apiMessage(nextError, 'Reservations could not be loaded.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [status]);

  const shown = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return reservations;
    return reservations.filter((reservation) =>
      `${reservation.id} ${reservation.customer.name} ${reservation.customer.email} ${reservation.hotel.name} ${reservation.room.name}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, reservations]);

  async function cancelReservation() {
    setSaving(true);
    setError('');
    try {
      const updated = await adminApi.updateReservationStatus(
        selected.id,
        'cancelled',
      );
      setReservations((current) =>
        status === 'confirmed'
          ? current.filter((item) => item.id !== updated.id)
          : current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setAnnouncement(`Reservation ${updated.id} was cancelled.`);
      setSelected(null);
      setConfirming(false);
    } catch (nextError) {
      setError(
        apiMessage(
          nextError,
          'The reservation could not be cancelled. Refresh the register before trying again.',
        ),
      );
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  }

  function closeDialog() {
    if (saving) return;
    setSelected(null);
    setConfirming(false);
  }

  return (
    <main id="admin-content" className={styles.main}>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.kicker}>Collection operations</p>
          <h1>Reservations</h1>
          <p>Review stays and release inventory when a booking is cancelled.</p>
        </div>
        <span className={styles.registerStamp}>
          Live register
          <strong>
            {reservations.length}{' '}
            {reservations.length === 1 ? 'record' : 'records'}
          </strong>
        </span>
      </div>
      <p className="srOnly" role="status">
        {announcement}
      </p>
      {!selected && <FormNotice error={error} />}
      <section className={styles.panel} aria-labelledby="reservation-title">
        <div className={styles.panelHeading}>
          <div>
            <h2 id="reservation-title">Reservation register</h2>
            <span>
              {shown.length} {shown.length === 1 ? 'record' : 'records'} shown
            </span>
          </div>
          <div className={styles.filters}>
            <div className={styles.compactSearch}>
              <Search size={18} aria-hidden="true" />
              <Field
                label="Search reservations"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Guest, email, hotel, or ID"
              />
            </div>
            <SelectField
              label="Status"
              value={status}
              onChange={(event) => {
                setLoading(true);
                setError('');
                setStatus(event.target.value);
              }}
            >
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </SelectField>
          </div>
        </div>
        {loading ? (
          <p className={styles.loadingState} role="status">
            Loading the reservation register.
          </p>
        ) : shown.length ? (
          <div
            className={styles.tableScroll}
            role="region"
            aria-label="Reservation records"
            tabIndex={0}
          >
            <table className={styles.table}>
              <caption className="srOnly">
                Hotel reservations with guest, stay, price, and status details.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Guest / reservation</th>
                  <th scope="col">Hotel and room</th>
                  <th scope="col">Stay dates</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col" className={styles.actionColumn}>
                    <span className="srOnly">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((reservation) => (
                  <tr key={reservation.id}>
                    <th scope="row">
                      <span className={styles.guestCell}>
                        <span className={styles.avatar} aria-hidden="true">
                          {initials(reservation.customer.name)}
                        </span>
                        <span>
                          {reservation.customer.name}
                          <small>
                            {reservation.customer.email} / #{reservation.id}
                          </small>
                        </span>
                      </span>
                    </th>
                    <td>
                      <span>{reservation.hotel.name}</span>
                      <small>{reservation.room.name}</small>
                    </td>
                    <td>
                      <span>{shortDate(reservation.checkIn)}</span>
                      <small>to {shortDate(reservation.checkOut)}</small>
                    </td>
                    <td className={styles.tabular}>
                      {money(reservation.totalPrice)}
                    </td>
                    <td>
                      <StatusBadge status={reservation.status} />
                    </td>
                    <td className={styles.actionColumn}>
                      <Button
                        variant="quiet"
                        aria-label={`View reservation ${reservation.id}`}
                        onClick={() => {
                          setError('');
                          setSelected(reservation);
                        }}
                      >
                        <ChevronRight size={19} aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <CalendarDays size={28} aria-hidden="true" />
            <h3>No matching reservations</h3>
            <p>
              Change the status filter or search term to view another record.
            </p>
          </div>
        )}
      </section>
      <Dialog
        open={Boolean(selected)}
        onClose={closeDialog}
        title={
          confirming
            ? 'Cancel this reservation?'
            : selected
              ? `Reservation ${selected.id}`
              : 'Reservation'
        }
      >
        {selected && (
          <div className={styles.reservationDetails}>
            <FormNotice error={error} />
            <div className={styles.detailLead}>
              <div>
                <strong>{selected.customer.name}</strong>
                <span>{selected.customer.email}</span>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <dl className={styles.detailGrid}>
              <div>
                <dt>Hotel</dt>
                <dd>{selected.hotel.name}</dd>
              </div>
              <div>
                <dt>Room</dt>
                <dd>{selected.room.name}</dd>
              </div>
              <div>
                <dt>Check-in</dt>
                <dd>{shortDate(selected.checkIn)}</dd>
              </div>
              <div>
                <dt>Check-out</dt>
                <dd>{shortDate(selected.checkOut)}</dd>
              </div>
              <div>
                <dt>Guests</dt>
                <dd>{selected.guests}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{money(selected.totalPrice)}</dd>
              </div>
            </dl>
            {confirming ? (
              <p className={styles.confirmCopy}>
                Cancellation is permanent and immediately returns this room to
                available inventory for the stay dates.
              </p>
            ) : null}
            <div className={styles.dialogActions}>
              <Button
                variant="secondary"
                onClick={closeDialog}
                disabled={saving}
              >
                {confirming ? 'Keep reservation' : 'Close details'}
              </Button>
              {selected.status === 'confirmed' && (
                <Button
                  variant="danger"
                  onClick={
                    confirming ? cancelReservation : () => setConfirming(true)
                  }
                  loading={saving}
                >
                  {confirming ? 'Confirm cancellation' : 'Cancel reservation'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </main>
  );
}
