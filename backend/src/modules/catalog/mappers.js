function money(value) {
  if (typeof value === 'number') return value.toFixed(2);
  const [whole, fraction = ''] = String(value).split('.');
  return `${whole}.${fraction.padEnd(2, '0').slice(0, 2)}`;
}

export function mapHotel(row) {
  if (!row) return null;
  const hotel = {
    id: String(row.id),
    name: row.name,
    description: row.description,
    city: row.city,
    address: row.address,
    rating: Number(row.rating).toFixed(1),
    imageUrl: row.image_url,
    amenities: row.amenities ?? [],
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
  };
  if ('starting_price' in row)
    hotel.startingPrice =
      row.starting_price === null ? null : money(row.starting_price);
  return hotel;
}

export function mapRoom(row) {
  if (!row) return null;
  const room = {
    id: String(row.id),
    hotelId: String(row.hotel_id),
    name: row.name,
    description: row.description,
    pricePerNight: money(row.price_per_night),
    capacity: Number(row.capacity),
    totalRooms: Number(row.total_rooms),
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
  };
  if ('remaining_rooms' in row) {
    room.remainingRooms = Number(row.remaining_rooms);
    room.available = Boolean(row.available);
  }
  if ('estimated_total' in row)
    room.estimatedTotal = money(row.estimated_total);
  return room;
}
