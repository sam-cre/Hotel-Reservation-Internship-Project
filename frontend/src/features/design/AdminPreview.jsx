import { useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { Brand } from '../../components/Brand.jsx';
import { Button, ButtonLink } from '../../components/ui/Button.jsx';
import { Field, SelectField } from '../../components/ui/Field.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { PreviewBar } from './PreviewBar.jsx';
import {
  reservations,
  money,
  shortDate,
  nightsBetween,
} from './sample-data.js';
import styles from './Preview.module.css';

export function AdminPreview() {
  const [rows, setRows] = useState(reservations);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [hotel, setHotel] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const selected = rows.find((row) => row.id === selectedId);
  const shown = rows.filter(
    (row) =>
      (status === 'all' || row.status === status) &&
      (hotel === 'all' || row.hotel === hotel) &&
      `${row.guest} ${row.id}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  function close() {
    setSelectedId(null);
    setConfirmCancel(false);
  }
  function cancel() {
    setRows((current) =>
      current.map((row) =>
        row.id === selectedId ? { ...row, status: 'cancelled' } : row,
      ),
    );
    setAnnouncement(
      `${selectedId} was cancelled in this preview. No real reservation was changed.`,
    );
    close();
  }
  return (
    <>
      <a className="skipLink" href="#admin-content">
        Skip to reservations
      </a>
      <PreviewBar />
      <div className={styles.adminLayout}>
        <aside className={styles.sidebar}>
          <Brand />
          <p className={styles.workspaceLabel}>Hotel workspace</p>
          <nav aria-label="Administration">
            <a
              className={styles.activeNav}
              href="#admin-content"
              aria-current="page"
            >
              <CalendarDays size={19} aria-hidden="true" />
              Reservations
              <ChevronRight size={16} aria-hidden="true" />
            </a>
            <ButtonLink to="/design/customer" variant="quiet">
              <Building2 size={19} aria-hidden="true" />
              Hotel collection
              <ArrowUpRight size={15} aria-hidden="true" />
            </ButtonLink>
            <ButtonLink to="/design/components" variant="quiet">
              <SlidersHorizontal size={19} aria-hidden="true" />
              Design controls
            </ButtonLink>
          </nav>
          <div className={styles.sidebarBottom}>
            <span className={styles.workspaceAccount}>
              <span>SW</span>
              <span>
                Stillwater operations<small>Sample administrator</small>
              </span>
            </span>
          </div>
        </aside>
        <div className={styles.adminWorkspace}>
          <header className={styles.adminTopbar}>
            <span>
              Workspace <ChevronRight size={14} aria-hidden="true" />
              Reservations
            </span>
            <ButtonLink to="/design/customer" variant="quiet">
              View guest site
              <ArrowUpRight size={16} aria-hidden="true" />
            </ButtonLink>
          </header>
          <main id="admin-content" className={styles.adminMain}>
            <div className={styles.adminHeading}>
              <div>
                <p className={styles.breadcrumb}>Collection operations</p>
                <h1>Reservations</h1>
                <p className={styles.muted}>
                  Review upcoming stays across every property.
                </p>
              </div>
              <span className={styles.samplePeriod}>
                Sample stays
                <br />
                <strong>October 2026</strong>
              </span>
            </div>
            <dl className={styles.summaryStats}>
              <div>
                <dt>Reservations</dt>
                <dd>
                  {rows.length}
                  <span>across the collection</span>
                </dd>
              </div>
              <div>
                <dt>Confirmed</dt>
                <dd>
                  {rows.filter((row) => row.status === 'confirmed').length}
                  <span>rooms ready for a stay</span>
                </dd>
              </div>
              <div>
                <dt>Cancelled</dt>
                <dd>
                  {rows.filter((row) => row.status === 'cancelled').length}
                  <span>retained in the record</span>
                </dd>
              </div>
            </dl>
            <section
              className={styles.reservationsPanel}
              aria-labelledby="list-title"
            >
              <div className={styles.panelHeading}>
                <h2 id="list-title">All reservations</h2>
                <span>
                  {shown.length} of {rows.length} records
                </span>
              </div>
              <div className={styles.adminFilters}>
                <div className={styles.filterSearch}>
                  <Search size={18} aria-hidden="true" />
                  <Field
                    label="Search reservations"
                    placeholder="Guest name or booking ID"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <SelectField
                  label="Hotel"
                  value={hotel}
                  onChange={(e) => setHotel(e.target.value)}
                >
                  <option value="all">All hotels</option>
                  {[...new Set(reservations.map((row) => row.hotel))].map(
                    (name) => (
                      <option key={name}>{name}</option>
                    ),
                  )}
                </SelectField>
                <SelectField
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </SelectField>
              </div>
              <p className="srOnly" role="status">
                {announcement || `${shown.length} sample reservations shown.`}
              </p>
              {shown.length > 0 && (
                <p className={styles.tableHint}>
                  Scroll across for stay dates and amounts. Open a row for full
                  details.
                </p>
              )}
              {shown.length ? (
                <div
                  className={styles.tableScroll}
                  role="region"
                  aria-label="Reservation records"
                  tabIndex={0}
                >
                  <table className={styles.table}>
                    <caption className="srOnly">
                      Sample hotel reservations. Open a reservation to review
                      it.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Guest / reservation</th>
                        <th scope="col">Hotel & room</th>
                        <th scope="col">Stay dates</th>
                        <th scope="col">Total</th>
                        <th scope="col">Status</th>
                        <th scope="col">
                          <span className="srOnly">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((row) => (
                        <tr key={row.id}>
                          <th scope="row">
                            <div className={styles.guestCell}>
                              <span
                                className={styles.avatar}
                                aria-hidden="true"
                              >
                                {row.initials}
                              </span>
                              <span>
                                {row.guest}
                                <small>{row.id}</small>
                              </span>
                            </div>
                          </th>
                          <td>
                            <span>{row.hotel}</span>
                            <small>{row.room}</small>
                          </td>
                          <td>
                            <span>
                              {shortDate(row.checkIn)}{' '}
                              <span className={styles.dateSeparator}>to</span>{' '}
                              {shortDate(row.checkOut)}
                            </span>
                            <small>
                              {nightsBetween(row.checkIn, row.checkOut)} nights,{' '}
                              {row.guests}{' '}
                              {row.guests === 1 ? 'guest' : 'guests'}
                            </small>
                          </td>
                          <td className={styles.tableMoney}>
                            {money(row.total)}
                          </td>
                          <td>
                            <StatusBadge status={row.status} />
                          </td>
                          <td>
                            <Button
                              variant="quiet"
                              aria-label={`View reservation ${row.id}`}
                              onClick={() => setSelectedId(row.id)}
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
                  <Search size={28} aria-hidden="true" />
                  <h3>No matching reservations</h3>
                  <p>Try another name or reset the filters.</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery('');
                      setHotel('all');
                      setStatus('all');
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              )}
              <div className={styles.tableFooter}>
                <span>All amounts in USD</span>
                <span>
                  <Check size={14} aria-hidden="true" />
                  Sample data, saved for this visit only
                </span>
              </div>
            </section>
            <p className={styles.adminNote}>
              Reservation changes in this preview reset when you reload the
              page.
            </p>
          </main>
        </div>
      </div>
      <Dialog
        open={Boolean(selected)}
        onClose={close}
        title={
          confirmCancel
            ? 'Cancel this sample reservation?'
            : selected
              ? `Reservation ${selected.id}`
              : 'Reservation'
        }
      >
        {selected && (
          <>
            <div className={styles.detailHeader}>
              <p>{selected.guest}</p>
              <StatusBadge status={selected.status} />
            </div>
            <dl className={styles.details}>
              <div>
                <dt>Hotel</dt>
                <dd>{selected.hotel}</dd>
              </div>
              <div>
                <dt>Room</dt>
                <dd>{selected.room}</dd>
              </div>
              <div>
                <dt>Dates</dt>
                <dd>
                  {shortDate(selected.checkIn)} to{' '}
                  {shortDate(selected.checkOut)}, 2026
                </dd>
              </div>
              <div>
                <dt>Guests</dt>
                <dd>{selected.guests}</dd>
              </div>
              <div>
                <dt>Sample total</dt>
                <dd>{money(selected.total)}</dd>
              </div>
            </dl>
            {confirmCancel ? (
              <>
                <p>
                  This changes the sample record to cancelled. No real booking
                  or inventory is affected.
                </p>
                <div className={styles.dialogActions}>
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmCancel(false)}
                  >
                    Keep reservation
                  </Button>
                  <Button variant="danger" onClick={cancel}>
                    Confirm cancellation
                  </Button>
                </div>
              </>
            ) : (
              <div className={styles.dialogActions}>
                <Button variant="secondary" onClick={close}>
                  Close details
                </Button>
                {selected.status === 'confirmed' && (
                  <Button
                    variant="danger"
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancel reservation
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Dialog>
    </>
  );
}
