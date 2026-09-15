import { createHash } from 'node:crypto';

export function createReservationFingerprint({
  roomId,
  checkIn,
  checkOut,
  guests,
}) {
  return createHash('sha256')
    .update(JSON.stringify([roomId, checkIn, checkOut, guests]))
    .digest('hex');
}
