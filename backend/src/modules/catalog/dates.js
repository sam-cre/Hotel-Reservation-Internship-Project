import { HttpError } from '../../http/errors.js';

export function dateOnlyToday(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function differenceInNights(checkIn, checkOut) {
  const start = Date.parse(`${checkIn}T00:00:00.000Z`);
  const end = Date.parse(`${checkOut}T00:00:00.000Z`);
  return (end - start) / 86400000;
}

export function validateStayWindow(criteria, today = dateOnlyToday()) {
  if (!criteria.checkIn) return null;
  const fields = [];
  if (criteria.checkIn < today) fields.push('checkIn');
  if (criteria.checkOut <= criteria.checkIn) fields.push('checkOut');
  if (fields.length > 0)
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request is invalid.', {
      fields,
    });
  return {
    checkIn: criteria.checkIn,
    checkOut: criteria.checkOut,
    guests: criteria.guests,
    nights: differenceInNights(criteria.checkIn, criteria.checkOut),
  };
}
