import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check, MapPin, RefreshCw, Star } from 'lucide-react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Photo } from '../../components/ui/Photo.jsx';
import { apiMessage, catalogApi } from '../../services/api.js';
import { SearchForm } from './SearchForm.jsx';
import { StayLine } from './StayLine.jsx';
import {
  money,
  stayFromParams,
  stayQuery,
  validateStay,
} from './customer-utils.js';
import styles from './Customer.module.css';

function HotelRow({ hotel, stay, eager }) {
  return (
    <article className={styles.hotelRow} aria-labelledby={`hotel-${hotel.id}`}>
      <div className={styles.hotelImage}>
        <Photo
          src={hotel.imageUrl}
          alt={`${hotel.name} in ${hotel.city}`}
          width="1200"
          height="800"
          loading={eager ? 'eager' : 'lazy'}
        />
        <span>
          <MapPin size={14} aria-hidden="true" />
          {hotel.city}
        </span>
      </div>
      <div className={styles.hotelContent}>
        <div className={styles.hotelTitle}>
          <h3 id={`hotel-${hotel.id}`}>{hotel.name}</h3>
          <span className={styles.rating}>
            <Star size={14} aria-hidden="true" />
            {hotel.rating}
            <span className="srOnly"> out of 5</span>
          </span>
        </div>
        <p className={styles.hotelDescription}>{hotel.description}</p>
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
        <div className={styles.hotelBottom}>
          <div>
            <p className={styles.price}>
              {hotel.startingPrice == null ? (
                'Rates unavailable'
              ) : (
                <>
                  From <strong>{money(hotel.startingPrice)}</strong>
                  <span> / night</span>
                </>
              )}
            </p>
            <p className={styles.priceNote}>
              Final stay total is confirmed from live room availability.
            </p>
          </div>
          <Link
            className={styles.primaryLink}
            to={`/hotels/${hotel.id}?${stayQuery(stay)}`}
          >
            View rooms <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stay = useMemo(() => stayFromParams(params), [params]);
  const requestKey = stayQuery(stay);
  const hasCity = Boolean(stay.city);
  const canSearch = Object.keys(validateStay(stay)).length === 0;
  const [cities, setCities] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [state, setState] = useState({ key: '', error: '' });
  const loading = canSearch && state.key !== requestKey;
  const resultsRef = useRef(null);

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

  // A completed search navigates here with a flag so the results scroll into
  // view. On phones the search widget sits below a tall hero, so without this
  // the guest would be left looking at the hero after pressing Find rooms.
  useEffect(() => {
    if (!location.state?.scrollToResults) return;
    const node = resultsRef.current;
    if (!node) return;
    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    node.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [location.state]);

  useEffect(() => {
    if (!canSearch) return undefined;
    const controller = new AbortController();
    catalogApi
      .hotels(stay, controller.signal)
      .then((records) => {
        setHotels(records);
        setState({ key: requestKey, error: '' });
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED')
          setState({
            key: requestKey,
            error: apiMessage(error, 'We could not load hotels for this stay.'),
          });
      });
    return () => controller.abort();
  }, [canSearch, requestKey, stay]);

  const displayError = !canSearch
    ? hasCity
      ? 'These stay details are invalid. Update the dates and try again.'
      : ''
    : state.key === requestKey
      ? state.error
      : '';

  function search(next) {
    navigate(`/search?${stayQuery(next)}`, {
      state: { scrollToResults: true },
    });
  }

  return (
    <main id="main-content">
      <section className={styles.hero} aria-labelledby="search-title">
        <div className={styles.heroMedia}>
          <Photo
            src="/images/hero-harbor.jpg"
            alt="Evening light across a waterfront hotel terrace"
            width="1672"
            height="941"
            loading="eager"
          />
        </div>
        <div className={styles.heroInner}>
          <p className={styles.heroKicker}>Stillwater Hotels</p>
          <h1 id="search-title" className={styles.heroTitle}>
            Find your stay.
          </h1>
          <p className={styles.heroSummary}>
            Search hotels by city and dates, check live availability, and book
            in a few steps.
          </p>
        </div>
      </section>
      <div className={styles.pageBody}>
        <section
          id="stay-search"
          className={styles.searchDock}
          aria-label="Search hotels"
        >
          <SearchForm
            stay={stay}
            cities={cities}
            onSearch={search}
            busy={loading}
          />
          <ul className={styles.searchAssurances}>
            <li>
              <Check size={15} aria-hidden="true" />
              Live availability
            </li>
            <li>
              <Check size={15} aria-hidden="true" />
              Instant confirmation
            </li>
            <li>
              <Check size={15} aria-hidden="true" />
              No booking fees
            </li>
          </ul>
        </section>
        <section
          ref={resultsRef}
          className={styles.resultsSection}
          aria-labelledby="results-title"
        >
          <div className={styles.resultsHeading}>
            <div>
              <h2 id="results-title">
                {hasCity
                  ? `Hotels in ${stay.city}.`
                  : 'Where would you like to go?'}
              </h2>
              <p className={styles.muted}>
                {!hasCity
                  ? 'Choose a destination and dates above to see hotels with live availability.'
                  : loading
                    ? 'Checking live room inventory.'
                    : `${hotels.length} ${hotels.length === 1 ? 'hotel' : 'hotels'} match this stay.`}
              </p>
            </div>
          </div>
          {hasCity && <StayLine stay={stay} />}
          {!hasCity && (
            <div className={styles.statePanel}>
              <h3>Start with a destination.</h3>
              <p>
                Pick a city and your dates to see available hotels and their
                live nightly rates.
              </p>
            </div>
          )}
          {hasCity && displayError && (
            <div className={styles.statePanel} role="alert">
              <h3>We could not complete that search.</h3>
              <p>{displayError}</p>
              <Button variant="secondary" onClick={() => search(stay)}>
                <RefreshCw size={17} aria-hidden="true" />
                Try again
              </Button>
            </div>
          )}
          {hasCity && !displayError && loading && (
            <div className={styles.statePanel} aria-live="polite">
              <h3>Finding your stay.</h3>
              <p>We are checking current room availability and rates.</p>
            </div>
          )}
          {hasCity && !displayError && !loading && hotels.length === 0 && (
            <div className={styles.statePanel}>
              <h3>A different stay is waiting.</h3>
              <p>
                No hotels have qualifying rooms for these dates and guests. Try
                another date or destination.
              </p>
            </div>
          )}
          {hasCity && !displayError && !loading && hotels.length > 0 && (
            <div className={styles.hotelList}>
              {hotels.map((hotel, index) => (
                <HotelRow
                  key={hotel.id}
                  hotel={hotel}
                  stay={stay}
                  eager={index === 0}
                />
              ))}
            </div>
          )}
          <div className={styles.closingNote}>
            <span>All rates in USD</span>
          </div>
        </section>
      </div>
    </main>
  );
}
