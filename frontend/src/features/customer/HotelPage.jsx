import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, MapPin, RefreshCw, Star } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { apiMessage, catalogApi } from '../../services/api.js';
import { StayLine } from './StayLine.jsx';
import { WeatherSummary } from './WeatherSummary.jsx';
import {
  money,
  stayFromParams,
  stayQuery,
  validateStay,
} from './customer-utils.js';
import styles from './Customer.module.css';

export function HotelPage() {
  const { hotelId } = useParams();
  const [params] = useSearchParams();
  const stay = useMemo(() => stayFromParams(params), [params]);
  const requestKey = `${hotelId}?${stayQuery(stay)}`;
  const invalidStay = Object.keys(validateStay(stay)).length > 0;
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [state, setState] = useState({ key: '', error: '' });
  const loading = !invalidStay && state.key !== requestKey;

  useEffect(() => {
    if (invalidStay) return undefined;
    const controller = new AbortController();
    Promise.all([
      catalogApi.hotel(hotelId, controller.signal),
      catalogApi.rooms(
        hotelId,
        { checkIn: stay.checkIn, checkOut: stay.checkOut, guests: stay.guests },
        controller.signal,
      ),
    ])
      .then(([nextHotel, nextRooms]) => {
        setHotel(nextHotel);
        setRooms(nextRooms);
        setState({ key: requestKey, error: '' });
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED')
          setState({
            key: requestKey,
            error: apiMessage(error, 'We could not load this hotel.'),
          });
      });
    return () => controller.abort();
  }, [hotelId, invalidStay, requestKey, stay]);

  const displayError = invalidStay
    ? 'The stay dates in this link are invalid. Return to search to choose new dates.'
    : state.key === requestKey
      ? state.error
      : '';

  return (
    <main id="main-content" className={styles.main}>
      <div className={styles.pageBack}>
        <Link to={`/search?${stayQuery(stay)}`}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to {stay.city} hotels
        </Link>
      </div>
      {loading && (
        <section className={styles.statePanel} aria-live="polite">
          <h1>Preparing the hotel register.</h1>
          <p>We are checking rooms for your stay.</p>
        </section>
      )}
      {displayError && (
        <section className={styles.statePanel} role="alert">
          <h1>This hotel is unavailable.</h1>
          <p>{displayError}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            <RefreshCw size={17} aria-hidden="true" />
            Try again
          </Button>
        </section>
      )}
      {!loading && !displayError && hotel && (
        <>
          <section className={styles.hotelHero}>
            <div className={styles.hotelHeroImage}>
              <img
                src={hotel.imageUrl}
                alt={`${hotel.name} in ${hotel.city}`}
                width="1400"
                height="900"
              />
            </div>
            <div className={styles.hotelHeroCopy}>
              <p className={styles.kicker}>{hotel.city}</p>
              <h1>{hotel.name}</h1>
              <p className={styles.hotelLead}>{hotel.description}</p>
              <WeatherSummary city={hotel.city} />
              <p className={styles.location}>
                <MapPin size={17} aria-hidden="true" />
                {hotel.address}
              </p>
              <p className={styles.rating}>
                <Star size={15} aria-hidden="true" />
                {hotel.rating}
                <span className="srOnly"> out of 5</span>
              </p>
              {hotel.amenities?.length > 0 && (
                <ul className={styles.features}>
                  {hotel.amenities.map((feature) => (
                    <li key={feature}>
                      <Check size={15} aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          <section className={styles.roomSection} aria-labelledby="rooms-title">
            <div className={styles.sectionHeading}>
              <p className={styles.kicker}>Available for your dates</p>
              <h2 id="rooms-title">Choose your room.</h2>
            </div>
            <StayLine stay={stay} />
            {rooms.length === 0 ? (
              <div className={styles.statePanel}>
                <h3>No rooms remain for this stay.</h3>
                <p>
                  Return to the hotel search to adjust the dates or guest count.
                </p>
              </div>
            ) : (
              <div className={styles.roomList}>
                {rooms.map((room) => (
                  <article key={room.id} className={styles.roomRow}>
                    <div>
                      <p className={styles.roomNumber}>
                        {String(room.remainingRooms).padStart(2, '0')} available
                      </p>
                      <h3>{room.name}</h3>
                      <p>{room.description}</p>
                      <p className={styles.available}>
                        <Check size={16} aria-hidden="true" />
                        Up to {room.capacity} guests
                      </p>
                    </div>
                    <div className={styles.roomPrice}>
                      <p>
                        <strong>{money(room.pricePerNight)}</strong> / night
                      </p>
                      <p>{money(room.estimatedTotal)} stay total</p>
                      <Link
                        className={styles.primaryLink}
                        to={`/reserve?${stayQuery(stay)}&hotelId=${hotel.id}&roomId=${room.id}`}
                      >
                        Review this room
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
