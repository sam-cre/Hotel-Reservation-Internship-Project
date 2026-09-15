export const hotels = [
  {
    id: 'the-battery',
    name: 'The Battery',
    city: 'Charleston',
    neighborhood: 'Cooper River',
    description:
      'A landmark waterfront hotel with a rooftop terrace, destination dining, and harbor views.',
    rating: '4.9',
    price: 465,
    capacity: 2,
    rooms: 3,
    image: '/images/battery-terrace.jpg',
    alt: 'Rooftop hotel terrace with a reflecting pool, conservatory, and harbor skyline at dusk.',
    features: ['Rooftop pool', 'Harbor dining', '24-hour concierge'],
    room: 'Harbor View King',
    size: 41,
  },
  {
    id: 'the-calhoun',
    name: 'The Calhoun',
    city: 'Charleston',
    neighborhood: 'Harleston Village',
    description:
      'A grand courtyard hotel pairing contemporary Southern design with full-service hospitality.',
    rating: '4.8',
    price: 395,
    capacity: 4,
    rooms: 5,
    image: '/images/calhoun-lobby.jpg',
    alt: 'Spacious limestone hotel lobby opening onto a landscaped courtyard.',
    features: ['Courtyard spa', 'Signature restaurant', 'Valet parking'],
    room: 'Courtyard Double',
    size: 44,
  },
  {
    id: 'the-forsyth',
    name: 'The Forsyth',
    city: 'Savannah',
    neighborhood: 'Historic District',
    description:
      'A full-service city hotel overlooking the park, with generous rooms and a destination restaurant.',
    rating: '4.8',
    price: 425,
    capacity: 2,
    rooms: 2,
    image: '/images/calhoun-lobby.jpg',
    alt: 'Spacious limestone hotel lobby opening onto a landscaped courtyard.',
    features: ['Park views', 'Full-service spa', 'Concierge'],
    room: 'Park View King',
    size: 39,
  },
];

export const reservations = [
  {
    id: 'SW-1048',
    guest: 'Olivia Martin',
    initials: 'OM',
    hotel: 'The Battery',
    room: 'Harbor View King',
    checkIn: '2026-10-09',
    checkOut: '2026-10-12',
    guests: 2,
    total: 1395,
    status: 'confirmed',
  },
  {
    id: 'SW-1047',
    guest: 'James Chen',
    initials: 'JC',
    hotel: 'The Calhoun',
    room: 'Courtyard Double',
    checkIn: '2026-10-09',
    checkOut: '2026-10-13',
    guests: 3,
    total: 1580,
    status: 'confirmed',
  },
  {
    id: 'SW-1046',
    guest: 'Amelia Brooks',
    initials: 'AB',
    hotel: 'The Battery',
    room: 'Harbor View King',
    checkIn: '2026-10-10',
    checkOut: '2026-10-12',
    guests: 2,
    total: 930,
    status: 'cancelled',
  },
  {
    id: 'SW-1045',
    guest: 'Noah Williams',
    initials: 'NW',
    hotel: 'The Forsyth',
    room: 'Park View King',
    checkIn: '2026-10-11',
    checkOut: '2026-10-14',
    guests: 2,
    total: 1275,
    status: 'confirmed',
  },
  {
    id: 'SW-1044',
    guest: 'Sofia Patel',
    initials: 'SP',
    hotel: 'The Calhoun',
    room: 'Courtyard Double',
    checkIn: '2026-10-12',
    checkOut: '2026-10-15',
    guests: 4,
    total: 1185,
    status: 'confirmed',
  },
  {
    id: 'SW-1043',
    guest: 'Ethan Miller',
    initials: 'EM',
    hotel: 'The Battery',
    room: 'Harbor View King',
    checkIn: '2026-10-13',
    checkOut: '2026-10-15',
    guests: 1,
    total: 930,
    status: 'cancelled',
  },
];

export function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function defaultStay() {
  const start = new Date();
  start.setDate(start.getDate() + 14);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  return {
    city: 'Charleston',
    checkIn: isoDate(start),
    checkOut: isoDate(end),
    guests: '2',
  };
}

export function nightsBetween(start, end) {
  return Math.round(
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
      86400000,
  );
}

export const money = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
export const shortDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));

export function validateStay(stay, today = isoDate(new Date())) {
  const errors = {};
  const validDate = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if (!validDate(stay.checkIn) || stay.checkIn < today)
    errors.checkIn = 'Choose today or a future date.';
  if (!validDate(stay.checkOut) || stay.checkOut <= stay.checkIn)
    errors.checkOut = 'Choose a date after check-in.';
  if (!['Charleston', 'Savannah', 'Newport'].includes(stay.city))
    errors.city = 'Choose a city from the list.';
  if (!/^[1-4]$/.test(String(stay.guests)))
    errors.guests = 'Choose between 1 and 4 guests.';
  return errors;
}
