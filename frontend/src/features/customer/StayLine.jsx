import { CalendarDays, Users } from 'lucide-react';
import { money, nightsBetween, shortDate } from './customer-utils.js';
import styles from './Customer.module.css';

export function StayLine({ stay, total }) {
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
        <dt>{total == null ? 'Length of stay' : 'Stay total'}</dt>
        <dd>
          {total == null
            ? `${nights} ${nights === 1 ? 'night' : 'nights'}`
            : money(total)}
        </dd>
      </div>
    </dl>
  );
}
