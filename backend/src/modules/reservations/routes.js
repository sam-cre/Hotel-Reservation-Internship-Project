import { Router } from 'express';
import { asyncHandler } from '../../http/errors.js';
import { parseRequest } from '../../http/validation.js';
import { createReservationService } from './service.js';
import {
  idempotencyHeaderSchema,
  reservationIdParamsSchema,
  reservationListSchema,
  reservationMutationSchema,
  reservationStatusSchema,
} from './validation.js';

export function createReservationRouter({
  database,
  authenticate,
  authorizeAdmin,
  now,
}) {
  const service = createReservationService({ database, now });
  const router = Router();

  router.post(
    '/reservations',
    authenticate,
    asyncHandler(async (req, res) => {
      const input = parseRequest(reservationMutationSchema, req.body);
      const { idempotencyKey } = parseRequest(idempotencyHeaderSchema, {
        idempotencyKey: req.get('Idempotency-Key'),
      });
      const result = await service.createReservation({
        userId: req.auth.user.id,
        input,
        idempotencyKey,
      });
      res
        .status(result.created ? 201 : 200)
        .json({ reservation: result.reservation });
    }),
  );

  router.get(
    '/reservations/my',
    authenticate,
    asyncHandler(async (req, res) => {
      res.json({
        reservations: await service.listMyReservations(req.auth.user.id),
      });
    }),
  );

  router.get(
    '/reservations/:id',
    authenticate,
    asyncHandler(async (req, res) => {
      const { id } = parseRequest(reservationIdParamsSchema, req.params);
      res.json({
        reservation: await service.getReservation(id, req.auth.user),
      });
    }),
  );

  router.get(
    '/admin/reservations',
    authenticate,
    authorizeAdmin,
    asyncHandler(async (req, res) => {
      const { status } = parseRequest(reservationListSchema, req.query);
      res.json({
        reservations: await service.listAdministratorReservations(status),
      });
    }),
  );

  router.put(
    '/admin/reservations/:id/status',
    authenticate,
    authorizeAdmin,
    asyncHandler(async (req, res) => {
      const { id } = parseRequest(reservationIdParamsSchema, req.params);
      const { status } = parseRequest(reservationStatusSchema, req.body);
      res.json({ reservation: await service.updateStatus(id, status) });
    }),
  );

  return router;
}
