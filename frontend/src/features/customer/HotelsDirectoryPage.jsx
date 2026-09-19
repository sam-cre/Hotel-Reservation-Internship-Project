import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { Photo } from '../../components/ui/Photo.jsx';
import { apiMessage, catalogApi } from '../../services/api.js';
import { defaultStay, money, stayQuery } from './customer-utils.js';
import styles from './Customer.module.css';

function citySlug(city) {
  return `city-${city.replace(/\s+/g, '-').toLowerCase()}`;
}

export function HotelsDirectoryPage() {
  const [hotels, setHotels] = useState([]);
  const [state, setState] = useState({ loading: true, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    catalogApi
      .hotels({}, controller.signal)
      .then((records) => {
        setHotels(records);
        setState({ loading: false, error: '' });
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED')
          setState({
            loading: false,
            error: apiMessage(error, 'We could not load our hotels right now.'),
          });
      });
    return () => controller.abort();
  }, []);

  // Group the collection by city so the page reads as a set of destinations.
  const groups = useMemo(() => {
    const byCity = new Map();
    for (const hotel of hotels) {
      if (!byCity.has(hotel.city)) byCity.set(hotel.city, []);
      byCity.get(hotel.city).push(hotel);
    }
    return [...byCity.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [hotels]);

  return (
    <main id="main-content" className={styles.directoryPage}>
      <div className={styles.directoryLede}>
        <p className={styles.kicker}>Our hotels</p>
        <h1>The Stillwater collection.</h1>
        <p className={styles.muted}>
          {state.loading
            ? 'Loading our properties.'
            : `${hotels.length} ${hotels.length === 1 ? 'hotel' : 'hotels'} across ${groups.length} ${groups.length === 1 ? 'city' : 'cities'}.`}
        </p>
      </div>

      {state.error && (
        <div className={styles.statePanel} role="alert">
          <h2>We could not load our hotels.</h2>
          <p>{state.error}</p>
        </div>
      )}

      {!state.error &&
        groups.map(([city, list]) => (
          <section
            key={city}
            className={styles.cityGroup}
            aria-labelledby={citySlug(city)}
          >
            <h2 id={citySlug(city)}>{city}</h2>
            <div className={styles.hotelGrid}>
              {list.map((hotel) => (
                <Link
                  key={hotel.id}
                  className={styles.hotelCard}
                  to={`/search?${stayQuery({ ...defaultStay(), city: hotel.city })}`}
                >
                  <div className={styles.hotelCardImage}>
                    <Photo
                      src={hotel.imageUrl}
                      alt={`${hotel.name} in ${hotel.city}`}
                      width="1200"
                      height="800"
                    />
                  </div>
                  <div className={styles.hotelCardBody}>
                    <div className={styles.hotelCardTop}>
                      <h3>{hotel.name}</h3>
                      <span className={styles.rating}>
                        <Star size={14} aria-hidden="true" />
                        {hotel.rating}
                        <span className="srOnly"> out of 5</span>
                      </span>
                    </div>
                    <span className={styles.hotelCardCity}>
                      <MapPin size={14} aria-hidden="true" />
                      {hotel.city}
                    </span>
                    <p className={styles.hotelCardPrice}>
                      {hotel.startingPrice == null ? (
                        'Rates unavailable'
                      ) : (
                        <>
                          From <strong>{money(hotel.startingPrice)}</strong> /
                          night
                        </>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
    </main>
  );
}
