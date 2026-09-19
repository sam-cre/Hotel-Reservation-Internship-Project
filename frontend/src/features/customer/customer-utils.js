export function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function defaultStay() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 14);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);
  return {
    // No destination is preselected: the guest chooses a city before searching,
    // so the homepage opens on an invitation rather than an arbitrary default.
    city: '',
    checkIn: isoDate(checkIn),
    checkOut: isoDate(checkOut),
    guests: '2',
  };
}

export function stayFromParams(params) {
  const fallback = defaultStay();
  return {
    city: params.get('city') || fallback.city,
    checkIn: params.get('checkIn') || fallback.checkIn,
    checkOut: params.get('checkOut') || fallback.checkOut,
    guests: params.get('guests') || fallback.guests,
  };
}

// An ISO string that matches the shape can still be an impossible calendar day
// (for example 2026-02-31). Confirm the parsed date round-trips to the same
// year, month, and day before treating it as valid.
export function isRealIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function validateStay(stay, today = isoDate(new Date())) {
  const errors = {};
  if (!stay.city) errors.city = 'Choose a destination.';
  if (!isRealIsoDate(stay.checkIn) || stay.checkIn < today)
    errors.checkIn = 'Choose today or a future date.';
  if (!isRealIsoDate(stay.checkOut) || stay.checkOut <= stay.checkIn)
    errors.checkOut = 'Choose a date after check-in.';
  if (!/^[1-4]$/.test(String(stay.guests)))
    errors.guests = 'Choose between 1 and 4 guests.';
  return errors;
}

export function stayQuery(stay) {
  return new URLSearchParams(stay).toString();
}

export function nightsBetween(start, end) {
  const span =
    Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Number.isFinite(span) ? Math.round(span / 86400000) : 0;
}

export const money = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Number(value) % 1 ? 2 : 0,
  }).format(Number(value));

export const shortDate = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  // A malformed date param (from a crafted or stale URL) must not crash the
  // page; fall back to the raw value rather than formatting an invalid date.
  if (Number.isNaN(date.getTime())) return String(value ?? '');
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

function currentOrigin() {
  return typeof window === 'undefined' ? undefined : window.location.origin;
}

function hasUnsafeCharacters(value) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (character === '\\' || codePoint < 32 || codePoint === 127) return true;
  }
  return false;
}

// A stored return destination must resolve to a path on this same application.
// Anything that could canonicalize to another origin (protocol-relative paths,
// backslash tricks, control characters, absolute URLs) falls back to the home
// route so a crafted login link cannot forward an authenticated guest offsite.
export function safeReturnTo(value, origin = currentOrigin()) {
  if (typeof value !== 'string' || value === '') return '/';
  if (hasUnsafeCharacters(value)) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  if (!origin) return value;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return '/';
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
