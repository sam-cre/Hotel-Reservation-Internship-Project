function money(value) {
  if (typeof value === 'number') return value.toFixed(2);
  const [whole, fraction = ''] = String(value).split('.');
  return `${whole}.${fraction.padEnd(2, '0').slice(0, 2)}`;
}

function dateOnly(value) {
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

export function mapReservation(row, { includeCustomer = false } = {}) {
  if (!row) return null;
  const reservation = {
    id: String(row.id),
    userId: String(row.user_id),
    roomId: String(row.room_id),
    checkIn: dateOnly(row.check_in),
    checkOut: dateOnly(row.check_out),
    guests: Number(row.guests),
    pricePerNight: money(row.price_per_night_snapshot),
    totalPrice: money(row.total_price),
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    room: {
      id: String(row.room_id),
      name: row.room_name,
    },
    hotel: {
      id: String(row.hotel_id),
      name: row.hotel_name,
      city: row.hotel_city,
    },
  };
  if (includeCustomer) {
    reservation.customer = {
      id: String(row.user_id),
      name: row.customer_name,
      email: row.customer_email,
    };
  }
  return reservation;
}
