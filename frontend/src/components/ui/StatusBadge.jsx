import { Check, Minus } from 'lucide-react';
import styles from './Ui.module.css';

export function StatusBadge({ status }) {
  const confirmed = status === 'confirmed';
  const Icon = confirmed ? Check : Minus;
  return (
    <span
      className={`${styles.badge} ${confirmed ? styles.confirmed : styles.cancelled}`}
    >
      <Icon size={13} aria-hidden="true" />
      {confirmed ? 'Confirmed' : 'Cancelled'}
    </span>
  );
}
