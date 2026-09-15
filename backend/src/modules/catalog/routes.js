import { Router } from 'express';
import { asyncHandler } from '../../http/errors.js';
import { parseRequest } from '../../http/validation.js';
import { createCatalogService } from './service.js';
import {
  availabilitySchema,
  hotelIdParamsSchema,
  hotelMutationSchema,
  hotelSearchSchema,
  idParamsSchema,
  roomListSchema,
  roomMutationSchema,
} from './validation.js';

export function createCatalogRouter({
  database,
  authenticate,
  authorizeAdmin,
  now,
}) {
  const service = createCatalogService({ database, now });
  const router = Router();
  const admin = [authenticate, authorizeAdmin];

  router.get(
    '/hotels',
    asyncHandler(async (req, res) => {
      const criteria = parseRequest(hotelSearchSchema, req.query);
      res.json({ hotels: await service.searchHotels(criteria) });
    }),
  );
  router.get(
    '/hotels/:hotelId/rooms',
    asyncHandler(async (req, res) => {
      const { hotelId } = parseRequest(hotelIdParamsSchema, req.params);
      const criteria = parseRequest(roomListSchema, req.query);
      res.json({ rooms: await service.listRooms(hotelId, criteria) });
    }),
  );
  router.get(
    '/hotels/:id',
    asyncHandler(async (req, res) => {
      const { id } = parseRequest(idParamsSchema, req.params);
      res.json({ hotel: await service.getHotel(id) });
    }),
  );
  router.get(
    '/rooms/availability',
    asyncHandler(async (req, res) => {
      const criteria = parseRequest(availabilitySchema, req.query);
      const stay = {
        checkIn: criteria.checkIn,
        checkOut: criteria.checkOut,
        guests: criteria.guests,
      };
      res.json({
        criteria: { hotelId: criteria.hotelId, ...stay },
        rooms: await service.availability(criteria),
      });
    }),
  );

  router.post(
    '/hotels',
    ...admin,
    asyncHandler(async (req, res) => {
      const hotel = await service.createHotel(
        parseRequest(hotelMutationSchema, req.body),
      );
      res.status(201).json({ hotel });
    }),
  );
  router.put(
    '/hotels/:id',
    ...admin,
    asyncHandler(async (req, res) => {
      const { id } = parseRequest(idParamsSchema, req.params);
      const input = parseRequest(hotelMutationSchema, req.body);
      res.json({ hotel: await service.updateHotel(id, input) });
    }),
  );
  router.delete(
    '/hotels/:id',
    ...admin,
    asyncHandler(async (req, res) => {
      const { id } = parseRequest(idParamsSchema, req.params);
      await service.deleteHotel(id);
      res.status(204).end();
    }),
  );
  router.post(
    '/hotels/:hotelId/rooms',
    ...admin,
    asyncHandler(async (req, res) => {
      const { hotelId } = parseRequest(hotelIdParamsSchema, req.params);
      const input = parseRequest(roomMutationSchema, req.body);
      const room = await service.createRoom(hotelId, input);
      res.status(201).json({ room });
    }),
  );
  router.put(
    '/rooms/:id',
    ...admin,
    asyncHandler(async (req, res) => {
      const { id } = parseRequest(idParamsSchema, req.params);
      const input = parseRequest(roomMutationSchema, req.body);
      res.json({ room: await service.updateRoom(id, input) });
    }),
  );
  router.delete(
    '/rooms/:id',
    ...admin,
    asyncHandler(async (req, res) => {
      const { id } = parseRequest(idParamsSchema, req.params);
      await service.deleteRoom(id);
      res.status(204).end();
    }),
  );

  return router;
}
