import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  Compass,
  MapPin,
  Search,
  Star,
} from 'lucide-react';
import { Brand } from '../../components/Brand.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, SelectField } from '../../components/ui/Field.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { PreviewBar } from './PreviewBar.jsx';
import { StayLine } from './StayLine.jsx';
import {
  defaultStay,
  hotels,
  isoDate,
  money,
  nightsBetween,
  validateStay,
} from './sample-data.js';
import styles from './Preview.module.css';

const legalTopics = {
  privacy: {
    title: 'Privacy notice',
    paragraphs: [
      'This design preview uses fictional hotel records and does not submit guest information to a server.',
      'Before launch, the privacy notice must explain what data is collected, why it is needed, how long it is retained, which service providers receive it, and how guests can exercise their privacy rights.',
    ],
  },
  terms: {
    title: 'Reservation terms',
    paragraphs: [
      'Final reservation terms will cover rates, taxes, payment timing, cancellations, changes, check-in requirements, and property policies.',
      'The production policy requires business-owner and legal review before reservations open. This preview does not create a contract or accept a booking.',
    ],
  },
  accessibility: {
    title: 'Accessibility',
    paragraphs: [
      'The reservation experience is being designed for keyboard, screen-reader, zoom, reduced-motion, and mobile access.',
      'Before launch, this page will also explain how guests can request accessible rooms, property details, and booking assistance.',
    ],
  },
  contact: {
    title: 'Contact Stillwater',
    paragraphs: [
      'Reservations and property contact details will be published when the fictional collection is connected to live hotel data.',
      'The final experience must provide a monitored email address, telephone number, response expectations, and an accessible way to request booking assistance.',
    ],
  },
};

function hasCookieChoice() {
  try {
    return window.localStorage.getItem('stillwater-cookie-choice') !== null;
  } catch {
    return false;
  }
}

function SearchForm({ stay, onSearch }) {
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  function submit(event) {
    event.preventDefault();
    const next = Object.fromEntries(new FormData(event.currentTarget));
    const issues = validateStay(next);
    setErrors(issues);
    if (Object.keys(issues).length) {
      formRef.current.elements.namedItem(Object.keys(issues)[0])?.focus();
      return;
    }
    onSearch(next);
  }
  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className={styles.searchForm}
      aria-label="Find a stay"
    >
      <SelectField label="Where to?" name="city" defaultValue={stay.city}>
        <option>Charleston</option>
        <option>Savannah</option>
        <option>Newport</option>
      </SelectField>
      <Field
        label="Check-in"
        name="checkIn"
        type="date"
        defaultValue={stay.checkIn}
        min={isoDate(new Date())}
        error={errors.checkIn}
        required
      />
      <Field
        label="Check-out"
        name="checkOut"
        type="date"
        defaultValue={stay.checkOut}
        min={stay.checkIn}
        error={errors.checkOut}
        required
      />
      <SelectField label="Guests" name="guests" defaultValue={stay.guests}>
        {[1, 2, 3, 4].map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? 'guest' : 'guests'}
          </option>
        ))}
      </SelectField>
      <Button type="submit">
        <Search size={18} aria-hidden="true" />
        Find rooms
      </Button>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className={styles.formSummary}>
          Check the highlighted dates and try again.
        </p>
      )}
    </form>
  );
}

export function CustomerPreview() {
  const [params, setParams] = useSearchParams();
  const defaults = defaultStay();
  const requested = Object.fromEntries(
    Object.keys(defaults).map((key) => [key, params.get(key) ?? defaults[key]]),
  );
  const invalidQuery = Object.keys(validateStay(requested)).length > 0;
  const stay = invalidQuery ? defaults : requested;
  const sort = params.get('sort') === 'price' ? 'price' : 'recommended';
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showCollection, setShowCollection] = useState(false);
  const [legalTopic, setLegalTopic] = useState(null);
  const [showCookiePrompt, setShowCookiePrompt] = useState(
    () => !hasCookieChoice(),
  );
  const [cookieAnnouncement, setCookieAnnouncement] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const matches = hotels
    .filter(
      (hotel) =>
        hotel.city === stay.city && hotel.capacity >= Number(stay.guests),
    )
    .sort((a, b) =>
      sort === 'price'
        ? a.price - b.price
        : Number(b.rating) - Number(a.rating),
    );
  function search(next) {
    setParams({ ...next, sort });
    const count = hotels.filter(
      (hotel) =>
        hotel.city === next.city && hotel.capacity >= Number(next.guests),
    ).length;
    setAnnouncement(
      `${count} sample ${count === 1 ? 'stay' : 'stays'} in ${next.city}.`,
    );
  }
  function chooseCookies(choice) {
    try {
      window.localStorage.setItem('stillwater-cookie-choice', choice);
    } catch {
      // The preference still applies for this page view when storage is unavailable.
    }
    setShowCookiePrompt(false);
    setCookieAnnouncement(
      choice === 'analytics'
        ? 'Analytics cookies allowed for this preview.'
        : 'Only essential storage allowed for this preview.',
    );
  }
  return (
    <>
      <a className="skipLink" href="#main-content">
        Skip to content
      </a>
      <PreviewBar />
      <header className={styles.guestHeader}>
        <div className={styles.headerInner}>
          <Brand />
          <nav aria-label="Main navigation">
            <a href="#hotel-results">Destinations</a>
            <button onClick={() => setShowCollection(true)}>
              About Stillwater
            </button>
          </nav>
          <a href="#stay-search" className={styles.headerAction}>
            Book a stay
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </header>
      <main id="main-content" className={styles.guestMain}>
        <section className={styles.intro} aria-labelledby="search-title">
          <p className={styles.introKicker}>The Stillwater collection</p>
          <h1 id="search-title">Hotels worth arriving for.</h1>
          <p className={styles.introSummary}>
            Distinctive destination hotels, shaped by their cities and made for
            a remarkable stay.
          </p>
        </section>
        <section
          id="stay-search"
          className={styles.searchSection}
          aria-label="Search hotels"
        >
          <SearchForm key={params.toString()} stay={stay} onSearch={search} />
          {invalidQuery && (
            <p role="status" className={styles.queryNotice}>
              Those search details were invalid. We have shown a new sample
              stay.
            </p>
          )}
        </section>
        <section
          id="hotel-results"
          aria-labelledby="results-title"
          className={styles.resultsSection}
        >
          <div className={styles.resultsHeading}>
            <div>
              <p className={styles.breadcrumb}>The collection / {stay.city}</p>
              <h2 id="results-title">Stay in {stay.city}.</h2>
              <p className={styles.muted}>
                {matches.length}{' '}
                {matches.length === 1
                  ? 'destination hotel'
                  : 'destination hotels'}{' '}
                available in this preview.
              </p>
            </div>
            <SelectField
              label="Sort by"
              value={sort}
              onChange={(e) => setParams({ ...stay, sort: e.target.value })}
            >
              <option value="recommended">Our recommendations</option>
              <option value="price">Price: low to high</option>
            </SelectField>
          </div>
          <p className="srOnly" role="status">
            {announcement}
          </p>
          <StayLine stay={stay} />
          {matches.length === 0 ? (
            <div className={styles.emptyState}>
              <Compass size={36} aria-hidden="true" />
              <h3>A different stay is waiting.</h3>
              <p>
                No sample hotels match these details. Try Charleston or
                Savannah, or reduce the number of guests.
              </p>
              <Button variant="secondary" onClick={() => search(defaults)}>
                Reset search
              </Button>
            </div>
          ) : (
            <div className={styles.hotelList}>
              {matches.map((hotel, index) => (
                <article
                  key={hotel.id}
                  className={styles.hotelRow}
                  aria-labelledby={`hotel-${hotel.id}`}
                >
                  <div className={styles.hotelImage}>
                    <img
                      src={hotel.image}
                      alt={hotel.alt}
                      width="1200"
                      height="800"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                    <span>
                      <MapPin size={14} aria-hidden="true" />
                      {hotel.neighborhood}
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
                    <p className={styles.hotelDescription}>
                      {hotel.description}
                    </p>
                    <ul className={styles.features}>
                      {hotel.features.map((feature) => (
                        <li key={feature}>
                          <Check size={15} aria-hidden="true" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className={styles.hotelBottom}>
                      <div>
                        <p className={styles.price}>
                          From <strong>{money(hotel.price)}</strong>
                          <span> / night</span>
                        </p>
                        <p className={styles.priceNote}>
                          {money(
                            hotel.price *
                              nightsBetween(stay.checkIn, stay.checkOut),
                          )}{' '}
                          for {nightsBetween(stay.checkIn, stay.checkOut)}{' '}
                          nights
                        </p>
                      </div>
                      <Button onClick={() => setSelectedHotel(hotel)}>
                        View rooms
                        <ArrowUpRight size={17} aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className={styles.closingNote}>
            <p>
              Independent in character. Consistent in service.
              <span> Stillwater Hotels.</span>
            </p>
            <span className={styles.currencyNote}>All sample rates in USD</span>
          </div>
        </section>
      </main>
      <footer className={styles.guestFooter}>
        <div className={styles.footerMain}>
          <div className={styles.footerIdentity}>
            <Brand />
            <p>Destination hotels with a strong sense of place.</p>
          </div>
          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore">Explore</h2>
            <a href="#hotel-results">Destinations</a>
            <button onClick={() => setShowCollection(true)}>
              About Stillwater
            </button>
            <a href="#stay-search">Book a stay</a>
          </nav>
          <nav aria-labelledby="footer-support">
            <h2 id="footer-support">Guest support</h2>
            <button onClick={() => setLegalTopic('contact')}>Contact</button>
            <button onClick={() => setLegalTopic('accessibility')}>
              Accessibility
            </button>
          </nav>
          <nav aria-labelledby="footer-legal">
            <h2 id="footer-legal">Legal</h2>
            <button onClick={() => setLegalTopic('privacy')}>Privacy</button>
            <button onClick={() => setLegalTopic('terms')}>
              Reservation terms
            </button>
            <button onClick={() => setShowCookiePrompt(true)}>
              Cookie preferences
            </button>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>Stillwater Hotels design preview</span>
          <span>Fictional properties and sample rates</span>
        </div>
      </footer>
      <p className="srOnly" role="status">
        {cookieAnnouncement}
      </p>
      {showCookiePrompt && (
        <section className={styles.cookieBanner} aria-labelledby="cookie-title">
          <div>
            <h2 id="cookie-title">Your privacy choices</h2>
            <p>
              This preview stores your choice on this device. Analytics stays
              off unless you allow it, and no analytics service is connected
              yet.
            </p>
          </div>
          <div className={styles.cookieActions}>
            <Button
              variant="secondary"
              onClick={() => chooseCookies('essential')}
            >
              Use essential only
            </Button>
            <Button onClick={() => chooseCookies('analytics')}>
              Allow analytics
            </Button>
          </div>
        </section>
      )}
      <Dialog
        open={Boolean(selectedHotel)}
        onClose={() => setSelectedHotel(null)}
        title={
          selectedHotel ? `Rooms at ${selectedHotel.name}` : 'Room details'
        }
      >
        {selectedHotel && (
          <>
            <p className={styles.dialogIntro}>
              Review the room and stay details before continuing.
            </p>
            <StayLine stay={stay} price={selectedHotel.price} />
            <div className={styles.roomOption}>
              <div>
                <h3>{selectedHotel.room}</h3>
                <p>
                  {selectedHotel.size} m². Up to {selectedHotel.capacity}{' '}
                  guests.
                </p>
                <p className={styles.available}>
                  <Check size={15} aria-hidden="true" />
                  {selectedHotel.rooms} rooms in this sample
                </p>
              </div>
              <strong>
                {money(selectedHotel.price)}
                <small> / night</small>
              </strong>
            </div>
            <p className={styles.previewNote}>
              This is a room preview. Booking will be available after the
              reservation system is connected.
            </p>
            <Button disabled>Reserve room</Button>
          </>
        )}
      </Dialog>
      <Dialog
        open={showCollection}
        onClose={() => setShowCollection(false)}
        title="The Stillwater way"
      >
        <p>
          Stillwater is a fictional collection of full-service destination
          hotels. Each property has its own architecture and local character,
          supported by a consistent standard of service.
        </p>
        <p>This preview explores the collection in Charleston and Savannah.</p>
        <Button variant="secondary" onClick={() => setShowCollection(false)}>
          Back to the collection
        </Button>
      </Dialog>
      <Dialog
        open={Boolean(legalTopic)}
        onClose={() => setLegalTopic(null)}
        title={legalTopic ? legalTopics[legalTopic].title : 'Guest information'}
      >
        {legalTopic &&
          legalTopics[legalTopic].paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        <Button variant="secondary" onClick={() => setLegalTopic(null)}>
          Close
        </Button>
      </Dialog>
    </>
  );
}
