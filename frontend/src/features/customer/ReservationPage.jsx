import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { apiMessage, catalogApi, reservationApi } from '../../services/api.js';
import { StayLine } from './StayLine.jsx';
import { money, stayFromParams, stayQuery } from './customer-utils.js';
import styles from './Customer.module.css';

function Confirmation({ id }) {
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    reservationApi
      .one(id, controller.signal)
      .then(setReservation)
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED')
          setError(
            apiMessage(requestError, 'We could not load this reservation.'),
          );
      });
    return () => controller.abort();
  }, [id]);
  if (error)
    return (
      <section className={styles.statePanel} role="alert">
        <h1>Reservation unavailable.</h1>
        <p>{error}</p>
      </section>
    );
  if (!reservation)
    return (
      <section className={styles.statePanel} aria-live="polite">
        <h1>Preparing your confirmation.</h1>
        <p>We are retrieving the booking record.</p>
      </section>
    );
  const stay = {
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    guests: String(reservation.guests),
  };
  return (
    <section className={styles.confirmation}>
      <div className={styles.confirmationMark}>
        <Check aria-hidden="true" />
      </div>
      <p className={styles.kicker}>Reservation confirmed</p>
      <h1>Your room is waiting.</h1>
      <p className={styles.confirmationReference}>
        Reservation <strong>{reservation.id}</strong>
      </p>
      <StayLine stay={stay} total={reservation.totalPrice} />
      <div className={styles.folio}>
        <div>
          <span>Hotel</span>
          <strong>{reservation.hotel.name}</strong>
          <small>{reservation.hotel.city}</small>
        </div>
        <div>
          <span>Room</span>
          <strong>{reservation.room.name}</strong>
          <small>{money(reservation.pricePerNight)} per night</small>
        </div>
        <div>
          <span>Status</span>
          <StatusBadge status={reservation.status} />
        </div>
      </div>
      <div className={styles.pageActions}>
        <Link className={styles.primaryLink} to="/reservations">
          View all reservations
        </Link>
        <Link to="/">Plan another stay</Link>
      </div>
    </section>
  );
}

export function ReservationPage({ confirmation = false }) {
  const { reservationId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const stay = useMemo(() => stayFromParams(params), [params]);
  const hotelId = params.get('hotelId');
  const roomId = params.get('roomId');
  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [state, setState] = useState({
    loading: !confirmation,
    busy: false,
    error: '',
  });
  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    if (confirmation) return undefined;
    if (!hotelId || !roomId) {
      setState({
        loading: false,
        busy: false,
        error:
          'The selected room is missing. Return to search and choose a room again.',
      });
      return undefined;
    }
    const controller = new AbortController();
    Promise.all([
      catalogApi.hotel(hotelId, controller.signal),
      catalogApi.rooms(
        hotelId,
        { checkIn: stay.checkIn, checkOut: stay.checkOut, guests: stay.guests },
        controller.signal,
      ),
    ])
      .then(([nextHotel, rooms]) => {
        const selected = rooms.find((candidate) => candidate.id === roomId);
        if (!selected) throw new Error('ROOM_NO_LONGER_AVAILABLE');
        setHotel(nextHotel);
        setRoom(selected);
        setState({ loading: false, busy: false, error: '' });
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED')
          setState({
            loading: false,
            busy: false,
            error:
              error.message === 'ROOM_NO_LONGER_AVAILABLE'
                ? 'This room is no longer available for the selected stay.'
                : apiMessage(error, 'We could not review this room.'),
          });
      });
    return () => controller.abort();
  }, [confirmation, hotelId, roomId, stay.checkIn, stay.checkOut, stay.guests]);

  async function book() {
    setState((current) => ({ ...current, busy: true, error: '' }));
    try {
      const reservation = await reservationApi.create(
        {
          roomId,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          guests: Number(stay.guests),
        },
        idempotencyKey.current,
      );
      navigate(`/reservations/${reservation.id}`, { replace: true });
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        error: apiMessage(error, 'We could not complete this reservation.'),
      }));
    }
  }

  if (confirmation)
    return (
      <main id="main-content" className={styles.narrowPage}>
        <Confirmation id={reservationId} />
      </main>
    );
  if (state.loading)
    return (
      <main id="main-content" className={styles.narrowPage}>
        <section className={styles.statePanel} aria-live="polite">
          <h1>Reviewing live availability.</h1>
          <p>We are confirming this room and its server-calculated price.</p>
        </section>
      </main>
    );
  return (
    <main id="main-content" className={styles.narrowPage}>
      <section className={styles.reviewPage}>
        <p className={styles.kicker}>Reservation review</p>
        <h1>Review your stay.</h1>
        <p className={styles.muted}>
          Nothing is reserved until you confirm below.
        </p>
        {room && (
          <>
            <StayLine stay={stay} total={room.estimatedTotal} />
            <div className={styles.folio}>
              <div>
                <span>Hotel</span>
                <strong>{hotel.name}</strong>
                <small>{hotel.city}</small>
              </div>
              <div>
                <span>Room</span>
                <strong>{room.name}</strong>
                <small>Up to {room.capacity} guests</small>
              </div>
              <div>
                <span>Rate</span>
                <strong>{money(room.pricePerNight)}</strong>
                <small>per night</small>
              </div>
            </div>
          </>
        )}
        {state.error && (
          <div className={styles.inlineError} role="alert">
            <p>{state.error}</p>
            {hotelId && (
              <Link to={`/hotels/${hotelId}?${stayQuery(stay)}`}>
                <RefreshCw size={16} aria-hidden="true" />
                Choose another room
              </Link>
            )}
          </div>
        )}
        {room && (
          <div className={styles.bookingActions}>
            <p>
              The server will recheck inventory and price before creating the
              reservation.
            </p>
            <Button onClick={book} loading={state.busy}>
              Confirm reservation
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
