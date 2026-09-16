import { useEffect, useState } from 'react';
import { ArrowLeft, BedDouble, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Field } from '../../components/ui/Field.jsx';
import { adminApi, apiMessage, catalogApi } from '../../services/api.js';
import { FormNotice, TextAreaField } from './AdminFields.jsx';
import { emptyRoom, money, roomInput } from './admin-utils.js';
import styles from './Admin.module.css';

export function RoomManagerDialog({ hotel, open, onClose }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null);
  const [values, setValues] = useState(emptyRoom);
  const [confirmRoom, setConfirmRoom] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !hotel) return;
    const controller = new AbortController();
    catalogApi
      .rooms(hotel.id, {}, controller.signal)
      .then(setRooms)
      .catch((nextError) => {
        if (nextError.code !== 'ERR_CANCELED')
          setError(apiMessage(nextError, 'Room types could not be loaded.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [hotel, open]);

  function edit(room) {
    setEditor(room || 'new');
    setValues(
      room
        ? {
            name: room.name,
            description: room.description,
            pricePerNight: room.pricePerNight,
            capacity: String(room.capacity),
            totalRooms: String(room.totalRooms),
          }
        : emptyRoom,
    );
    setError('');
  }

  function change(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function save(event) {
    event.preventDefault();
    const editing = editor !== 'new';
    setSaving(true);
    setError('');
    try {
      const saved = editing
        ? await adminApi.updateRoom(editor.id, roomInput(values))
        : await adminApi.createRoom(hotel.id, roomInput(values));
      setRooms((current) =>
        editing
          ? current.map((room) => (room.id === saved.id ? saved : room))
          : [...current, saved].sort(
              (a, b) => Number(a.pricePerNight) - Number(b.pricePerNight),
            ),
      );
      setEditor(null);
    } catch (nextError) {
      setError(
        apiMessage(
          nextError,
          'The room could not be saved. Your entries are still available.',
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivate() {
    setSaving(true);
    setError('');
    try {
      await adminApi.deactivateRoom(confirmRoom.id);
      setRooms((current) =>
        current.filter((room) => room.id !== confirmRoom.id),
      );
      setConfirmRoom(null);
    } catch (nextError) {
      setError(apiMessage(nextError, 'The room could not be deactivated.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? () => {} : onClose}
      title={
        editor
          ? editor === 'new'
            ? 'Add room type'
            : 'Edit room type'
          : `Rooms at ${hotel?.name || ''}`
      }
    >
      {editor ? (
        <form className={styles.editorForm} onSubmit={save}>
          <Button
            variant="quiet"
            className={styles.backButton}
            onClick={() => setEditor(null)}
            disabled={saving}
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back to room types
          </Button>
          <FormNotice error={error} />
          <Field
            label="Room name"
            name="name"
            value={values.name}
            onChange={change}
            maxLength={160}
            required
          />
          <TextAreaField
            label="Description"
            name="description"
            value={values.description}
            onChange={change}
            maxLength={5000}
            rows={4}
            required
          />
          <div className={styles.formGridThree}>
            <Field
              label="Nightly price"
              name="pricePerNight"
              type="number"
              value={values.pricePerNight}
              onChange={change}
              min="0.01"
              max="99999999.99"
              step="0.01"
              required
            />
            <Field
              label="Guest capacity"
              name="capacity"
              type="number"
              value={values.capacity}
              onChange={change}
              min="1"
              step="1"
              required
            />
            <Field
              label="Total rooms"
              name="totalRooms"
              type="number"
              value={values.totalRooms}
              onChange={change}
              min="1"
              step="1"
              required
            />
          </div>
          <FormNotice>
            Inventory reductions are checked against future confirmed stays.
          </FormNotice>
          <div className={styles.dialogActions}>
            <Button
              variant="secondary"
              onClick={() => setEditor(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save room type
            </Button>
          </div>
        </form>
      ) : (
        <div className={styles.roomManager}>
          <FormNotice error={error} />
          <div className={styles.roomManagerHeading}>
            <p>{hotel?.address}</p>
            <Button onClick={() => edit(null)}>
              <Plus size={17} aria-hidden="true" />
              Add room type
            </Button>
          </div>
          {loading ? (
            <p className={styles.loadingState} role="status">
              Loading room types.
            </p>
          ) : rooms.length ? (
            <ul className={styles.roomList}>
              {rooms.map((room) => (
                <li key={room.id}>
                  <span className={styles.roomIcon} aria-hidden="true">
                    <BedDouble size={20} />
                  </span>
                  <span className={styles.roomSummary}>
                    <strong>{room.name}</strong>
                    <span>
                      {money(room.pricePerNight)} per night, {room.capacity}{' '}
                      guests, {room.totalRooms} rooms
                    </span>
                  </span>
                  {confirmRoom?.id === room.id ? (
                    <span className={styles.inlineConfirm}>
                      <span>Deactivate this room type?</span>
                      <Button
                        variant="quiet"
                        onClick={() => setConfirmRoom(null)}
                        disabled={saving}
                      >
                        Keep
                      </Button>
                      <Button
                        variant="danger"
                        onClick={deactivate}
                        loading={saving}
                      >
                        Deactivate
                      </Button>
                    </span>
                  ) : (
                    <span className={styles.rowActions}>
                      <Button
                        variant="quiet"
                        onClick={() => edit(room)}
                        aria-label={`Edit ${room.name}`}
                      >
                        <Pencil size={17} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="quiet"
                        onClick={() => setConfirmRoom(room)}
                        aria-label={`Deactivate ${room.name}`}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </Button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyState}>
              <BedDouble size={28} aria-hidden="true" />
              <h3>No active room types</h3>
              <p>Add the first room type before accepting reservations.</p>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
