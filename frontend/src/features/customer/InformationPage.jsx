import { Link, useParams } from 'react-router-dom';
import { ButtonLink } from '../../components/ui/Button.jsx';
import styles from './Customer.module.css';

const topics = {
  privacy: {
    title: 'Privacy notice',
    reviewed: 'Last updated September 15, 2026',
    sections: [
      [
        'What we store',
        'We store the name and email provided at registration, a one-way password hash, account role, reservation dates, guest count, room selection, price snapshots, and reservation status. It never stores a readable password or payment-card information.',
      ],
      [
        'Why we use it',
        'Account data signs you in and limits reservation access to its owner. Reservation data provides your booking record and protects room inventory. Operational logs may retain a request identifier and technical error details without recording passwords or authentication tokens.',
      ],
      [
        'Cookies and browser storage',
        'A secure HTTP-only cookie maintains your signed-in session and cannot be read by page JavaScript. Browser storage records only your cookie preference. Optional analytics remain disabled unless you allow them.',
      ],
      [
        'Data retention',
        'Account and reservation records are kept while your account is active and as long as needed to maintain your booking history. Your cookie preference is stored on your device and can be changed at any time from the footer.',
      ],
    ],
  },
  terms: {
    title: 'Reservation terms',
    reviewed: 'Last updated September 15, 2026',
    sections: [
      [
        'Booking a stay',
        'A reservation confirms your selected room, dates, and guest count at the nightly rate shown when you book. Your booking record preserves the nightly rate and total captured at the moment of confirmation.',
      ],
      [
        'Rates and availability',
        'The server calculates room availability and the complete stay total when a reservation is submitted. A displayed room can become unavailable before confirmation if another reservation uses the final unit. Confirmed reservations preserve the nightly rate and total shown at booking time.',
      ],
      [
        'Changes and cancellation',
        'Reservation changes and cancellations are handled by guest services. An administrator can cancel a confirmed reservation. Any policies that apply to your rate are confirmed at the time of booking.',
      ],
    ],
  },
  accessibility: {
    title: 'Accessibility',
    reviewed: 'Last updated September 15, 2026',
    sections: [
      [
        'Our approach',
        'The booking journey is designed for keyboard navigation, screen readers, text enlargement, reduced motion, clear focus indicators, descriptive errors, and small screens. Information and status are not communicated by color alone.',
      ],
      [
        'Accessible stays',
        'For questions about accessible rooms or specific accommodations at a property, please contact guest services before booking so we can help arrange your stay.',
      ],
      [
        'Report a barrier',
        'If you encounter an accessibility barrier on this site, let us know through our contact page and we will work to resolve it.',
      ],
    ],
  },
  contact: {
    title: 'Contact Stillwater',
    reviewed: 'Last updated September 15, 2026',
    sections: [
      [
        'Guest services',
        'Our guest services team can help with new bookings, changes to an existing reservation, and questions about a property or your stay.',
      ],
      [
        'How to reach us',
        'Guest services handles reservations and general enquiries. The details for the property you have booked are included in your confirmation.',
      ],
      [
        'Response times',
        'Enquiries are answered in the order received, typically within one business day.',
      ],
    ],
  },
};

export function InformationPage() {
  const { topic } = useParams();
  const content = topics[topic];
  if (!content)
    return (
      <main id="main-content" className={styles.narrowPage}>
        <h1>Information not found.</h1>
        <ButtonLink to="/">Return home</ButtonLink>
      </main>
    );
  return (
    <main id="main-content" className={styles.policyPage}>
      <p className={styles.kicker}>Guest information</p>
      <h1>{content.title}</h1>
      <p className={styles.policyDate}>{content.reviewed}</p>
      {content.sections.map(([title, text]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{text}</p>
        </section>
      ))}
      <p className={styles.policyReturn}>
        <Link to="/">Return to hotel search</Link>
      </p>
    </main>
  );
}
