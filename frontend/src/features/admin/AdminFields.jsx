import { useId } from 'react';
import styles from './Admin.module.css';

export function TextAreaField({ label, error, hint, ...props }) {
  const id = useId();
  return (
    <div className={styles.formField}>
      <label htmlFor={id}>{label}</label>
      <textarea
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-description` : undefined}
      />
      {(error || hint) && (
        <span
          id={`${id}-description`}
          className={error ? styles.fieldError : styles.fieldHint}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}

export function FormNotice({ error, children }) {
  if (!error && !children) return null;
  return (
    <p className={error ? styles.formError : styles.formNotice} role="status">
      {error || children}
    </p>
  );
}
