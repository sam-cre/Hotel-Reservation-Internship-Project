import { useEffect, useId, useRef, useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Ui.module.css';

const WEEKDAYS = [
  ['Su', 'Sunday'],
  ['Mo', 'Monday'],
  ['Tu', 'Tuesday'],
  ['We', 'Wednesday'],
  ['Th', 'Thursday'],
  ['Fr', 'Friday'],
  ['Sa', 'Saturday'],
];
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

// Strict parse: an impossible date such as 2026-02-31 must not silently
// normalize to a real day. The parsed date has to round-trip back to the exact
// input, otherwise the value is treated as absent.
function parseIso(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return valid ? date : null;
}

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const daysInMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const addDays = (date, amount) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
// Keep the day of month when moving by whole months, clamping to the last day
// of a shorter target month (the WAI-ARIA Page Up/Down behavior).
function addMonths(date, amount) {
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  target.setDate(Math.min(date.getDate(), daysInMonth(target)));
  return target;
}
const sameMonth = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

// A themed calendar so the check-in and check-out fields match the rest of the
// design rather than each browser's native date control. The Popover primitive
// handles opening, outside clicks, Escape, and returning focus to the trigger.
function CalendarBody({ value, min, onSelect, titleId }) {
  const minDate = parseIso(min);
  const selected = parseIso(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Seed focus from the selected date only when it is real and still allowed;
  // otherwise start at the earliest selectable day.
  const floor = minDate && minDate > today ? minDate : today;
  const seed = selected && (!minDate || selected >= minDate) ? selected : floor;
  const [view, setView] = useState(startOfMonth(seed));
  const [activeIso, setActiveIso] = useState(toIso(seed));
  const dayRefs = useRef(new Map());

  useEffect(() => {
    dayRefs.current.get(activeIso)?.focus();
  }, [activeIso, view]);

  const canGoPrev = !minDate || startOfMonth(view) > startOfMonth(minDate);
  const todayIso = toIso(today);

  // Every movement is clamped so the active day is always selectable; a
  // disabled day can never become the single tab stop.
  function moveTo(date) {
    const clamped = minDate && date < minDate ? new Date(minDate) : date;
    if (!sameMonth(clamped, view)) setView(startOfMonth(clamped));
    setActiveIso(toIso(clamped));
  }

  function changeMonth(amount) {
    const active = parseIso(activeIso) ?? startOfMonth(view);
    moveTo(addMonths(active, amount));
  }

  function onKeyDown(event, iso) {
    const date = parseIso(iso);
    if (!date) return;
    const yearStep = event.shiftKey;
    const moves = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      Home: () => addDays(date, -date.getDay()),
      End: () => addDays(date, 6 - date.getDay()),
      PageUp: () => addMonths(date, yearStep ? -12 : -1),
      PageDown: () => addMonths(date, yearStep ? 12 : 1),
    };
    const compute = moves[event.key];
    if (!compute) return;
    event.preventDefault();
    moveTo(compute());
  }

  const firstWeekday = startOfMonth(view).getDay();
  const total = daysInMonth(view);
  const cells = [];
  for (let blank = 0; blank < firstWeekday; blank += 1) cells.push(null);
  for (let day = 1; day <= total; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let index = 0; index < cells.length; index += 7)
    weeks.push(cells.slice(index, index + 7));

  return (
    <>
      <div className={styles.calHeader}>
        <button
          type="button"
          className={styles.calNav}
          onClick={() => changeMonth(-1)}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span className={styles.calTitle} id={titleId} aria-live="polite">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button
          type="button"
          className={styles.calNav}
          onClick={() => changeMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      <table className={styles.calTable} role="grid" aria-labelledby={titleId}>
        <thead>
          <tr role="row">
            {WEEKDAYS.map(([short, full]) => (
              <th key={short} scope="col" role="columnheader">
                <abbr title={full}>{short}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex} role="row">
              {week.map((day, dayIndex) => {
                if (day === null)
                  return (
                    <td
                      key={`blank-${weekIndex}-${dayIndex}`}
                      role="gridcell"
                      aria-disabled="true"
                    />
                  );
                const cellDate = new Date(
                  view.getFullYear(),
                  view.getMonth(),
                  day,
                );
                const iso = toIso(cellDate);
                const disabled = Boolean(minDate) && cellDate < minDate;
                const isSelected = iso === value;
                return (
                  <td key={iso} role="gridcell" aria-selected={isSelected}>
                    <button
                      type="button"
                      ref={(node) => {
                        if (node) dayRefs.current.set(iso, node);
                        else dayRefs.current.delete(iso);
                      }}
                      className={styles.calDay}
                      data-selected={isSelected || undefined}
                      data-today={iso === todayIso || undefined}
                      tabIndex={iso === activeIso ? 0 : -1}
                      disabled={disabled}
                      aria-label={`${MONTHS[view.getMonth()]} ${day}, ${view.getFullYear()}`}
                      aria-current={iso === todayIso ? 'date' : undefined}
                      onKeyDown={(event) => onKeyDown(event, iso)}
                      onClick={() => onSelect(iso)}
                    >
                      {day}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function DatePicker({
  label,
  name,
  value,
  min,
  error,
  onChange,
  buttonRef,
  className = '',
}) {
  const id = useId();
  const titleId = `${id}-title`;
  const parsed = parseIso(value);
  return (
    <Popover className={`${styles.field} ${className}`}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.pickerAnchor}>
        <PopoverButton
          ref={buttonRef}
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
        <PopoverPanel className={styles.calendarPanel}>
          {({ close }) => (
            <CalendarBody
              value={value}
              min={min}
              titleId={titleId}
              onSelect={(iso) => {
                onChange?.({ target: { name, value: iso } });
                close();
              }}
            />
          )}
        </PopoverPanel>
      </div>
      {error && (
        <span id={`${id}-error`} className={styles.error}>
          {error}
        </span>
      )}
    </Popover>
  );
}
