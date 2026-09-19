import { useState } from 'react';
import { ImagePlus, LoaderCircle, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Field } from '../../components/ui/Field.jsx';
import { adminApi, apiMessage } from '../../services/api.js';
import { FormNotice, TextAreaField } from './AdminFields.jsx';
import { emptyHotel, hotelInput } from './admin-utils.js';
import styles from './Admin.module.css';

const acceptedImageTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxImageBytes = 5 * 1024 * 1024;

// Reads the chosen file into standard base64 (without the data-URL prefix) so it
// can be posted as JSON to the image upload endpoint.
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(',');
      resolve(comma === -1 ? result : result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

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
          amenities: (hotel.amenities ?? []).join(', '),
        }
      : emptyHotel,
  );
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(hotel);

  function change(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleImage(event) {
    const file = event.target.files?.[0];
    // Clear the input so choosing the same file again still fires a change.
    event.target.value = '';
    if (!file) return;
    if (!acceptedImageTypes.includes(file.type)) {
      setImageError('Choose a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > maxImageBytes) {
      setImageError('The image must be 5 MB or smaller.');
      return;
    }
    setImageError('');
    setUploading(true);
    try {
      const data = await fileToBase64(file);
      const url = await adminApi.uploadImage({ contentType: file.type, data });
      setValues((current) => ({ ...current, imageUrl: url }));
    } catch (nextError) {
      setImageError(apiMessage(nextError, 'The image could not be uploaded.'));
    } finally {
      setUploading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!values.imageUrl) {
      setImageError('Upload a hotel image before saving.');
      return;
    }
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
        <div className={styles.imageField}>
          <span className={styles.imageFieldLabel}>Hotel image</span>
          <div className={styles.imageUploader}>
            {values.imageUrl ? (
              <img
                className={styles.imagePreview}
                src={values.imageUrl}
                alt=""
              />
            ) : (
              <div className={styles.imagePlaceholder} aria-hidden="true">
                <ImagePlus size={22} />
              </div>
            )}
            <div className={styles.imageUploadControl}>
              <label
                className={`${styles.uploadButton} ${uploading ? styles.uploadButtonBusy : ''}`}
              >
                <input
                  type="file"
                  className="srOnly"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImage}
                  disabled={uploading || saving}
                />
                {uploading ? (
                  <LoaderCircle
                    size={17}
                    className={styles.spinner}
                    aria-hidden="true"
                  />
                ) : (
                  <Upload size={17} aria-hidden="true" />
                )}
                {uploading
                  ? 'Uploading...'
                  : values.imageUrl
                    ? 'Replace image'
                    : 'Upload image'}
              </label>
              <p className={styles.fieldHint}>
                PNG, JPEG, or WebP up to 5 MB. Recommended 1200x800.
              </p>
              {imageError && <p className={styles.fieldError}>{imageError}</p>}
            </div>
          </div>
        </div>
        <Field
          label="Amenities"
          name="amenities"
          value={values.amenities}
          onChange={change}
          maxLength={800}
          placeholder="Rooftop terrace, Valet parking, Concierge"
          hint="Separate up to 12 amenities with commas."
        />
        <div className={styles.dialogActions}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={uploading}>
            {editing ? 'Save hotel' : 'Add hotel'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
