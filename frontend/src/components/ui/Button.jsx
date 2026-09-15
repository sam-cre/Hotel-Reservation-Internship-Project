import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import styles from './Ui.module.css';

export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${styles.button} ${styles[variant]} ${className}`}
    >
      {loading && (
        <LoaderCircle size={18} className={styles.spinner} aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <Link
      {...props}
      className={`${styles.button} ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
