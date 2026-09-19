import { withTransaction } from '../../db/pool.js';
import { HttpError } from '../../http/errors.js';
import { dateOnlyToday, validateStayWindow } from '../catalog/dates.js';
import { createReservationFingerprint } from './fingerprint.js';
import { createReservationRepository } from './repository.js';

function notFound() {
  return new HttpError(404, 'NOT_FOUND', 'Reservation was not found.');
}

function conflict(code, message) {
  return new HttpError(409, code, message);
}

export function createReservationService({ database, now = () => new Date() }) {
  const repository = createReservationRepository(database);

  return {
    async createReservation({ userId, input, idempotencyKey }) {
      const stay = validateStayWindow(input, dateOnlyToday(now()));
      const fingerprint = createReservationFingerprint(input);
      return withTransaction(database, async (client) => {
        const user = await repository.lockUser(client, userId);
        if (!user)
          throw new HttpError(
            401,
            'AUTHENTICATION_REQUIRED',
            'Sign in is required.',
          );

        const existing = await repository.findByIdempotencyKey(
          client,
          userId,
          idempotencyKey,
        );
        if (existing) {
          if (existing.fingerprint !== fingerprint)
            throw conflict(
              'IDEMPOTENCY_KEY_REUSED',
              'That idempotency key was already used for another request.',
            );
          return { created: false, reservation: existing.reservation };
        }

        const room = await repository.lockBookableRoom(client, input.roomId);
        if (!room)
          throw new HttpError(
            404,
            'ROOM_NOT_FOUND',
            'Room type was not found.',
          );
        if (input.guests > Number(room.capacity))
          throw conflict(
            'ROOM_CAPACITY_EXCEEDED',
            'That room type cannot accommodate the requested guests.',
          );

        const peakOccupancy = await repository.peakConcurrentConfirmed(
          client,
          input.roomId,
          stay.checkIn,
          stay.checkOut,
        );
        if (peakOccupancy >= Number(room.total_rooms))
          throw conflict(
            'ROOM_UNAVAILABLE',
            'That room type is no longer available for these dates.',
          );

        const reservation = await repository.create(
          client,
          {
            userId,
            roomId: input.roomId,
            checkIn: stay.checkIn,
            checkOut: stay.checkOut,
            guests: input.guests,
            idempotencyKey,
            fingerprint,
          },
          room.price_per_night,
        );
        return { created: true, reservation };
      });
    },

    async listMyReservations(userId) {
      return repository.listForUser(userId);
    },

    async getReservation(id, user) {
      const reservation = await repository.findPublicById(id);
      if (!reservation) throw notFound();
      if (user.role !== 'admin' && reservation.userId !== user.id)
        throw notFound();
      return reservation;
    },

    async listAdministratorReservations(status) {
      return repository.listForAdministrator(status);
    },

    async updateStatus(id, status) {
      if (status !== 'cancelled')
        throw new HttpError(400, 'VALIDATION_ERROR', 'Request is invalid.', {
          fields: ['status'],
        });
      const identity = await repository.findIdentity(id);
      if (!identity) throw notFound();

      return withTransaction(database, async (client) => {
        await repository.lockRoom(client, identity.room_id);
        const reservation = await repository.lockReservation(client, id);
        if (!reservation) throw notFound();
        if (reservation.status !== 'confirmed')
          throw conflict(
            'INVALID_STATUS_TRANSITION',
            'The reservation status cannot be changed again.',
          );
        return repository.cancel(client, id);
      });
    },
  };
}
