import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Field, SelectField } from '../../components/ui/Field.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { PreviewBar } from './PreviewBar.jsx';
import { Brand } from '../../components/Brand.jsx';
import styles from './Preview.module.css';

export function ControlsPreview() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const swatches = [
    ['Atlantic ink', '#112d33'],
    ['Petrol', '#155c66'],
    ['Mineral', '#c6d7d5'],
    ['Limestone', '#f1f2ef'],
    ['Aged brass', '#9a7448'],
  ];
  return (
    <>
      <PreviewBar />
      <main className={styles.controlsMain}>
        <Brand />
        <h1>The details make the stay.</h1>
        <p>
          Shared controls for the guest experience and hotel workspace. Use Tab
          to explore focus states.
        </p>
        <section aria-labelledby="buttons-title">
          <h2 id="buttons-title">Buttons</h2>
          <div className={styles.controlRow}>
            <Button onClick={() => setMessage('Sample changes saved.')}>
              <Check size={16} aria-hidden="true" />
              Save changes
            </Button>
            <Button variant="secondary" onClick={() => setOpen(true)}>
              View details
            </Button>
            <Button variant="danger" onClick={() => setOpen(true)}>
              Cancel reservation
            </Button>
            <Button disabled>Unavailable</Button>
            <Button loading>Saving changes</Button>
          </div>
          <p role="status">{message}</p>
        </section>
        <section aria-labelledby="fields-title">
          <h2 id="fields-title">Forms with a clear next step</h2>
          <div className={styles.controlFields}>
            <Field
              label="Guest name"
              placeholder="Full name"
              hint="As it appears on the reservation."
            />
            <Field
              label="Email address"
              type="email"
              defaultValue="example"
              error="Enter a complete email address."
            />
            <SelectField label="Room type">
              <option>Harbor King</option>
              <option>Garden Double</option>
            </SelectField>
          </div>
        </section>
        <section aria-labelledby="status-title">
          <h2 id="status-title">Status, in words and color</h2>
          <div className={styles.controlRow}>
            <StatusBadge status="confirmed" />
            <StatusBadge status="cancelled" />
          </div>
        </section>
        <section aria-labelledby="palette-title">
          <h2 id="palette-title">A confident, architectural palette</h2>
          <div className={styles.swatches}>
            {swatches.map(([name, color]) => (
              <div className={styles.swatch} key={name}>
                <span style={{ background: color }} />
                <strong>{name}</strong>
                {color}
              </div>
            ))}
          </div>
        </section>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="A clear moment to decide"
        >
          <p>
            Dialogs keep the next action in focus. Press Escape to close, or use
            the button below.
          </p>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Return to controls
          </Button>
        </Dialog>
      </main>
    </>
  );
}
