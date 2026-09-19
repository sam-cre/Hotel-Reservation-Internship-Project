import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  Building2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Field } from '../../components/ui/Field.jsx';
import { adminApi, apiMessage } from '../../services/api.js';
import { FormNotice } from './AdminFields.jsx';
import { HotelFormDialog } from './HotelFormDialog.jsx';
import { RoomManagerDialog } from './RoomManagerDialog.jsx';
import styles from './Admin.module.css';

export function HotelsAdminPage() {
  const [hotels, setHotels] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(undefined);
  const [roomsHotel, setRoomsHotel] = useState(null);
  const [deactivateHotel, setDeactivateHotel] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    adminApi
      .hotels(controller.signal)
      .then(setHotels)
      .catch((nextError) => {
        if (nextError.code !== 'ERR_CANCELED')
          setError(apiMessage(nextError, 'Hotels could not be loaded.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const shown = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return hotels;
    return hotels.filter((hotel) =>
      `${hotel.name} ${hotel.city} ${hotel.address}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [hotels, query]);

  function saved(hotel, editing) {
    setHotels((current) =>
      editing
        ? current.map((item) => (item.id === hotel.id ? hotel : item))
        : [...current, hotel].sort((a, b) =>
            `${a.city}${a.name}`.localeCompare(`${b.city}${b.name}`),
          ),
    );
    setAnnouncement(`${hotel.name} was ${editing ? 'updated' : 'added'}.`);
  }

  async function deactivate() {
    setDeactivating(true);
    setError('');
    try {
      await adminApi.deactivateHotel(deactivateHotel.id);
      setHotels((current) =>
        current.filter((hotel) => hotel.id !== deactivateHotel.id),
      );
      setAnnouncement(`${deactivateHotel.name} was deactivated.`);
      setDeactivateHotel(null);
    } catch (nextError) {
      setError(apiMessage(nextError, 'The hotel could not be deactivated.'));
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <main id="admin-content" className={styles.main}>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.kicker}>Collection operations</p>
          <h1>Hotels and rooms</h1>
          <p>
            Maintain the active properties and inventory guests can reserve.
          </p>
        </div>
        <Button onClick={() => setEditor(null)}>
          <Plus size={18} aria-hidden="true" />
          Add hotel
        </Button>
      </div>
      <p className="srOnly" role="status">
        {announcement}
      </p>
      {!deactivateHotel && <FormNotice error={error} />}
      <section className={styles.panel} aria-labelledby="hotel-list-title">
        <div className={styles.panelHeading}>
          <div>
            <h2 id="hotel-list-title">Active collection</h2>
            <span>{shown.length} properties shown</span>
          </div>
          <div className={styles.compactSearch}>
            <Search size={18} aria-hidden="true" />
            <Field
              label="Search hotels"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, city, or address"
            />
          </div>
        </div>
        {loading ? (
          <p className={styles.loadingState} role="status">
            Loading the hotel collection.
          </p>
        ) : shown.length ? (
          <div className={styles.hotelRows}>
            {shown.map((hotel) => (
              <article key={hotel.id} className={styles.hotelRow}>
                <img src={hotel.imageUrl} alt="" />
                <div className={styles.hotelIdentity}>
                  <span>{hotel.city}</span>
                  <h3>{hotel.name}</h3>
                  <p>{hotel.address}</p>
                </div>
                <dl className={styles.hotelFacts}>
                  <div>
                    <dt>Rating</dt>
                    <dd>{hotel.rating}</dd>
                  </div>
                  <div>
                    <dt>From</dt>
                    <dd>
                      {hotel.startingPrice
                        ? `$${Number(hotel.startingPrice).toLocaleString()}`
                        : 'No rooms'}
                    </dd>
                  </div>
                </dl>
                <div className={styles.hotelActions}>
                  <Button
                    variant="secondary"
                    onClick={() => setRoomsHotel(hotel)}
                  >
                    <BedDouble size={17} aria-hidden="true" />
                    Manage rooms
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() => setEditor(hotel)}
                    aria-label={`Edit ${hotel.name}`}
                  >
                    <Pencil size={17} aria-hidden="true" />
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() => {
                      setError('');
                      setDeactivateHotel(hotel);
                    }}
                    aria-label={`Deactivate ${hotel.name}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Building2 size={28} aria-hidden="true" />
            <h3>{hotels.length ? 'No matching hotels' : 'No active hotels'}</h3>
            <p>
              {hotels.length
                ? 'Try a different name or city.'
                : 'Add the first hotel to begin building the collection.'}
            </p>
          </div>
        )}
      </section>
      {editor !== undefined && (
        <HotelFormDialog
          key={editor?.id || 'new'}
          hotel={editor || null}
          open
          onClose={() => setEditor(undefined)}
          onSaved={saved}
        />
      )}
      {roomsHotel && (
        <RoomManagerDialog
          key={roomsHotel.id}
          hotel={roomsHotel}
          open
          onClose={() => setRoomsHotel(null)}
        />
      )}
      <Dialog
        open={Boolean(deactivateHotel)}
        onClose={deactivating ? () => {} : () => setDeactivateHotel(null)}
        title="Deactivate this hotel?"
      >
        {deactivateHotel && (
          <div className={styles.confirmation}>
            <FormNotice error={error} />
            <p>
              <strong>{deactivateHotel.name}</strong> and its room types will no
              longer appear to guests. Historical reservations will remain in
              the operational record.
            </p>
            <div className={styles.dialogActions}>
              <Button
                variant="secondary"
                onClick={() => setDeactivateHotel(null)}
                disabled={deactivating}
              >
                Keep hotel active
              </Button>
              <Button
                variant="danger"
                onClick={deactivate}
                loading={deactivating}
              >
                Deactivate hotel
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </main>
  );
}
