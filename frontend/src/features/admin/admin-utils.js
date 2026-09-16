export function money(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function shortDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export const emptyHotel = {
  name: '',
  description: '',
  city: '',
  address: '',
  rating: '4.5',
  imageUrl: '',
};

export const emptyRoom = {
  name: '',
  description: '',
  pricePerNight: '',
  capacity: '2',
  totalRooms: '1',
};

export function hotelInput(values) {
  return { ...values, rating: Number(values.rating) };
}

export function roomInput(values) {
  return {
    ...values,
    pricePerNight: Number(values.pricePerNight),
    capacity: Number(values.capacity),
    totalRooms: Number(values.totalRooms),
  };
}
