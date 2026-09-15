import { CalendarDays, Users } from 'lucide-react';
import { shortDate, nightsBetween, money } from './sample-data.js';
import styles from './Preview.module.css';

export function StayLine({ stay, price }) {
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  return (
    <dl className={styles.stayLine} aria-label="Your stay">
      <div>
        <dt>
          <CalendarDays size={15} aria-hidden="true" />
          Check-in
        </dt>
        <dd>{shortDate(stay.checkIn)}</dd>
      </div>
      <div>
        <dt>Check-out</dt>
        <dd>{shortDate(stay.checkOut)}</dd>
      </div>
      <div>
        <dt>
          <Users size={15} aria-hidden="true" />
          Guests
        </dt>
        <dd>
          {stay.guests} {Number(stay.guests) === 1 ? 'guest' : 'guests'}
        </dd>
      </div>
      <div>
        <dt>{price ? 'Sample total' : 'Length of stay'}</dt>
        <dd>
          {price
            ? money(nights * price)
            : `${nights} ${nights === 1 ? 'night' : 'nights'}`}
        </dd>
      </div>
    </dl>
  );
}
