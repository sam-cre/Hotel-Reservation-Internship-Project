import { Link } from 'react-router-dom';
import styles from './Brand.module.css';

export function Brand({ compact = false, to = '/' }) {
  return (
    <Link to={to} className={styles.brand} aria-label="Stillwater Hotels home">
      <svg
        width="38"
        height="38"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M28 10c1.9-1.6 3.2-3.5 4-5.8.8 2.3 2.1 4.2 4 5.8v38.5c-1.1 2-2.4 3.8-4 5.5-1.6-1.7-2.9-3.5-4-5.5V10Z"
          fill="currentColor"
        />
        <path
          d="M17 21.5c4.3-1.4 7.2-3.8 9-7.2v33.5c-2.8-4.2-5.8-7.2-9-9V21.5Zm30 0c-4.3-1.4-7.2-3.8-9-7.2v33.5c2.8-4.2 5.8-7.2 9-9V21.5Z"
          fill="currentColor"
        />
        <path
          d="M5 37.5c8.8.3 15.7 5.4 22.5 16.5-9.4-.4-15.8-3.2-19.3-8.4A17.3 17.3 0 0 1 5 37.5Zm54 0c-8.8.3-15.7 5.4-22.5 16.5 9.4-.4 15.8-3.2 19.3-8.4a17.3 17.3 0 0 0 3.2-8.1Z"
          fill="currentColor"
        />
        <path
          d="M18 56.2c4.4-.7 9-.9 14-.9s9.6.2 14 .9c-4.4.7-9 .9-14 .9s-9.6-.2-14-.9Zm6 3.6c2.5-.5 5.2-.7 8-.7s5.5.2 8 .7c-2.5.5-5.2.7-8 .7s-5.5-.2-8-.7Zm4.5 3c1.1-.3 2.3-.4 3.5-.4s2.4.1 3.5.4c-1.1.3-2.3.4-3.5.4s-2.4-.1-3.5-.4Z"
          fill="currentColor"
        />
      </svg>
      <span>
        Stillwater
        {!compact && <small>Hotels</small>}
      </span>
    </Link>
  );
}
