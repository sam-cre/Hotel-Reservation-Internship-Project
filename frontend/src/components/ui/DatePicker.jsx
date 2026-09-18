import { useEffect, useId, useRef, useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Ui.module.css';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const triggerFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const pad = (value) => String(value).padStart(2, '0');
const toIso = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
function parseIso(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addDays = (date, amount) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
const addMonths = (date, amount) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

// A themed calendar so the check-in and check-out fields match the rest of the
// design rather than each browser's native date control. The Popover primitive
// handles opening, outside clicks, Escape, and returning focus to the trigger.
function CalendarBody({ value, min, onSelect, labelledBy }) {
  const selected = parseIso(value);
  const minDate = parseIso(min);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const initial = selected ?? (minDate && minDate > today ? minDate : today);
  const [view, setView] = useState(startOfMonth(initial));
  const [activeIso, setActiveIso] = useState(toIso(initial));
  const dayRefs = useRef(new Map());

  useEffect(() => {
    dayRefs.current.get(activeIso)?.focus();
  }, [activeIso, view]);

  const minIso = minDate ? toIso(minDate) : null;
  const todayIso = toIso(today);
  const startWeekday = startOfMonth(view).getDay();
  const daysInMonth = new Date(
    view.getFullYear(),
    view.getMonth() + 1,
    0,
  ).getDate();
  const cells = [];
  for (let blank = 0; blank < startWeekday; blank += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  function move(iso) {
    const next = parseIso(iso);
    if (
      next.getMonth() !== view.getMonth() ||
      next.getFullYear() !== view.getFullYear()
    ) {
      setView(startOfMonth(next));
    }
    setActiveIso(iso);
  }

  function onKeyDown(event, iso) {
    const date = parseIso(iso);
    const keys = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      Home: () => addDays(date, -date.getDay()),
      End: () => addDays(date, 6 - date.getDay()),
      PageUp: () => addMonths(date, -1),
      PageDown: () => addMonths(date, 1),
    };
    const compute = keys[event.key];
    if (!compute) return;
    event.preventDefault();
    move(toIso(compute()));
  }

  return (
    <div role="group" aria-labelledby={labelledBy}>
      <div className={styles.calHeader}>
        <button
          type="button"
          className={styles.calNav}
          onClick={() => setView(addMonths(view, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span className={styles.calTitle} aria-live="polite">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button
          type="button"
          className={styles.calNav}
          onClick={() => setView(addMonths(view, 1))}
          aria-label="Next month"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      <div className={styles.calWeekdays} aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className={styles.calGrid} role="grid">
        {cells.map((day, index) => {
          if (day === null)
            return <span key={`blank-${index}`} aria-hidden="true" />;
          const iso = toIso(new Date(view.getFullYear(), view.getMonth(), day));
          const disabled = Boolean(minIso) && iso < minIso;
          const isSelected = iso === value;
          const isActive = iso === activeIso;
          const label = `${MONTHS[view.getMonth()]} ${day}, ${view.getFullYear()}`;
          return (
            <button
              key={iso}
              type="button"
              ref={(node) => {
                if (node) dayRefs.current.set(iso, node);
                else dayRefs.current.delete(iso);
              }}
              className={styles.calDay}
              data-selected={isSelected || undefined}
              data-today={iso === todayIso || undefined}
              tabIndex={isActive ? 0 : -1}
              disabled={disabled}
              aria-label={label}
              aria-current={iso === todayIso ? 'date' : undefined}
              aria-pressed={isSelected}
              onKeyDown={(event) => onKeyDown(event, iso)}
              onClick={() => onSelect(iso)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DatePicker({
  label,
  name,
  value,
  min,
  error,
  onChange,
  className = '',
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const parsed = parseIso(value);
  return (
    <Popover className={`${styles.field} ${className}`}>
      <label id={labelId} htmlFor={id}>
        {label}
      </label>
      <PopoverButton
        id={id}
        className={styles.selectTrigger}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <span className={parsed ? undefined : styles.selectPlaceholder}>
          {parsed ? triggerFormat.format(parsed) : 'Select a date'}
        </span>
        <span className={styles.selectIcon}>
          <Calendar size={17} aria-hidden="true" />
        </span>
      </PopoverButton>
      <PopoverPanel
        className={styles.calendarPanel}
        anchor={{ to: 'bottom start', gap: 6 }}
      >
        {({ close }) => (
          <CalendarBody
            value={value}
            min={min}
            labelledBy={labelId}
            onSelect={(iso) => {
              onChange?.({ target: { name, value: iso } });
              close();
            }}
          />
        )}
      </PopoverPanel>
      {error && (
        <span id={`${id}-error`} className={styles.error}>
          {error}
        </span>
      )}
    </Popover>
  );
}
