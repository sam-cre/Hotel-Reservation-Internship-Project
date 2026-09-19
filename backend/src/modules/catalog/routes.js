import express, { Router } from 'express';
import { asyncHandler } from '../../http/errors.js';
import { parseRequest } from '../../http/validation.js';
import { createCatalogService } from './service.js';
import {
  availabilitySchema,
  createHotelMutationSchema,
  hotelIdParamsSchema,
  hotelSearchSchema,
  idParamsSchema,
  imageUploadSchema,
  roomListSchema,
  roomMutationSchema,
} from './validation.js';

// Hotel image uploads carry a base64 payload far larger than the strict global
// body limit, so this route parses its own body. app.js skips the global parser
// for POST /api/admin/images so this ceiling is the only one that applies there.
const uploadJson = express.json({ limit: '8mb' });

export function createCatalogRouter({
  database,
  authenticate,
  authorizeAdmin,
  now,
  imageHostAllowlist = new Set(),
}) {
  const service = createCatalogService({ database, now });
  const hotelMutationSchema = createHotelMutationSchema(imageHostAllowlist);
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
    '/images/:id',
    asyncHandler(async (req, res) => {
      const { id } = parseRequest(idParamsSchema, req.params);
      const image = await service.getImage(id);
      // These bytes are content-addressed and never change, so allow caching
      // even though authenticated API responses default to no-store.
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      res.type(image.contentType).send(image.bytes);
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

  router.get(
    '/admin/hotels',
    ...admin,
    asyncHandler(async (_req, res) => {
      res.json({ hotels: await service.listAdminHotels() });
    }),
  );
  router.post(
    '/admin/images',
    ...admin,
    uploadJson,
    asyncHandler(async (req, res) => {
      const input = parseRequest(imageUploadSchema, req.body);
      res.status(201).json(await service.storeImage(input));
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
