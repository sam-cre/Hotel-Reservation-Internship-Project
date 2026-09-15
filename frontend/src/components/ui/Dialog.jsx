import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.jsx';
import styles from './Ui.module.css';

export function Dialog({ open, onClose, title, children }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);
  function keepFocusInside(event) {
    if (event.key !== 'Tab') return;
    const controls = [
      ...dialog.current.querySelectorAll(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((element) => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={onClose}
      onKeyDown={keepFocusInside}
    >
      <div className={styles.dialogHeading}>
        <h2 id={titleId}>{title}</h2>
        <Button variant="quiet" onClick={onClose} aria-label="Close dialog">
          <X size={20} aria-hidden="true" />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
