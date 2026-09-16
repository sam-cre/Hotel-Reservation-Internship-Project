import { useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Field } from '../../components/ui/Field.jsx';
import { adminApi, apiMessage } from '../../services/api.js';
import { FormNotice, TextAreaField } from './AdminFields.jsx';
import { emptyHotel, hotelInput } from './admin-utils.js';
import styles from './Admin.module.css';

export function HotelFormDialog({ hotel, open, onClose, onSaved }) {
  const [values, setValues] = useState(() =>
    hotel
      ? {
          name: hotel.name,
          description: hotel.description,
          city: hotel.city,
          address: hotel.address,
          rating: hotel.rating,
          imageUrl: hotel.imageUrl,
        }
      : emptyHotel,
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(hotel);

  function change(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = editing
        ? await adminApi.updateHotel(hotel.id, hotelInput(values))
        : await adminApi.createHotel(hotelInput(values));
      onSaved(saved, editing);
      onClose();
    } catch (nextError) {
      setError(
        apiMessage(
          nextError,
          `The hotel could not be ${editing ? 'updated' : 'created'}. Check each field and try again.`,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? () => {} : onClose}
      title={editing ? 'Edit hotel' : 'Add hotel'}
    >
      <form className={styles.editorForm} onSubmit={submit}>
        <FormNotice error={error} />
        <div className={styles.formGrid}>
          <Field
            label="Hotel name"
            name="name"
            value={values.name}
            onChange={change}
            maxLength={160}
            required
          />
          <Field
            label="City"
            name="city"
            value={values.city}
            onChange={change}
            maxLength={120}
            required
          />
        </div>
        <Field
          label="Street address"
          name="address"
          value={values.address}
          onChange={change}
          maxLength={300}
          required
        />
        <TextAreaField
          label="Description"
          name="description"
          value={values.description}
          onChange={change}
          maxLength={5000}
          rows={5}
          required
        />
        <div className={styles.formGrid}>
          <Field
            label="Rating"
            name="rating"
            type="number"
            value={values.rating}
            onChange={change}
            min="0"
            max="5"
            step="0.1"
            required
          />
          <Field
            label="Image URL"
            name="imageUrl"
            value={values.imageUrl}
            onChange={change}
            maxLength={2048}
            placeholder="/images/hotel.jpg"
            required
          />
        </div>
        <div className={styles.dialogActions}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {editing ? 'Save hotel' : 'Add hotel'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
