import { Link, useParams } from 'react-router-dom';
import { ButtonLink } from '../../components/ui/Button.jsx';
import styles from './Customer.module.css';

const topics = {
  privacy: {
    title: 'Privacy notice',
    reviewed: 'Project policy dated September 15, 2026',
    sections: [
      [
        'What this application stores',
        'The reservation system stores the name and email provided at registration, a one-way password hash, account role, reservation dates, guest count, room selection, price snapshots, and reservation status. It never stores a readable password or payment-card information.',
      ],
      [
        'Why the data is used',
        'Account data authenticates the guest and limits reservation access to its owner. Reservation data provides the booking record and protects room inventory. Operational logs may retain a request identifier and technical error details without recording passwords or authentication tokens.',
      ],
      [
        'Cookies and browser storage',
        'A secure HTTP-only cookie maintains the signed-in session. It cannot be read by application JavaScript. Browser storage records only the guest cookie preference. Optional analytics remain disabled because no analytics service is connected.',
      ],
      [
        'Project status',
        'Stillwater Hotels and its properties are fictional. This internship demonstration must not be used for a real hotel booking or for submitting sensitive personal information. Production retention, deletion, and privacy-request procedures require an operating business and legal approval before a public launch.',
      ],
    ],
  },
  terms: {
    title: 'Reservation terms',
    reviewed: 'Project policy dated September 15, 2026',
    sections: [
      [
        'Demonstration reservations',
        'Reservations created here are records in an internship demonstration. They do not reserve accommodation at a real property, create a contract, or charge a payment method.',
      ],
      [
        'Rates and availability',
        'The server calculates room availability and the complete stay total when a reservation is submitted. A displayed room can become unavailable before confirmation if another reservation uses the final unit. Confirmed demonstration records preserve the nightly rate and total shown at booking time.',
      ],
      [
        'Changes and cancellation',
        'Customer cancellation and reservation changes are outside the assignment scope. An administrator may mark a confirmed demonstration reservation as cancelled. A real service would require owner-approved cancellation, tax, payment, check-in, and property policies before accepting bookings.',
      ],
    ],
  },
  accessibility: {
    title: 'Accessibility',
    reviewed: 'Accessibility statement dated September 15, 2026',
    sections: [
      [
        'Our approach',
        'The customer journey is designed for keyboard navigation, screen readers, text enlargement, reduced motion, clear focus indicators, descriptive errors, and small screens. Information and status are not communicated by color alone.',
      ],
      [
        'Property accessibility',
        'The properties are fictional, so this project does not claim physical accessibility features for any room or building. A real booking service must publish verified accessible-room details and provide trained booking assistance.',
      ],
      [
        'Report a problem',
        'For this internship project, accessibility issues should be reported through the private repository review process. A public service would require a monitored, accessible support channel before launch.',
      ],
    ],
  },
  contact: {
    title: 'Contact Stillwater',
    reviewed: 'Project contact notice dated September 15, 2026',
    sections: [
      [
        'About this project',
        'Stillwater Hotels is a fictional reservation application created for an internship assignment. It has no operating hotels, public reservation desk, telephone line, or guest-support inbox.',
      ],
      [
        'Project review',
        'Questions and defects are handled by the project owner and internship reviewer through the private development repository. No public contact details are published because this application must not invite real booking requests.',
      ],
      [
        'Before a real launch',
        'A monitored email address, telephone number, response expectations, accessible assistance process, and escalation route must be approved and verified before the demonstration can represent an operating hotel business.',
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
