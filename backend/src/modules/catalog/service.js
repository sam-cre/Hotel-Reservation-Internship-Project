import { withTransaction } from '../../db/pool.js';
import { HttpError } from '../../http/errors.js';
import { dateOnlyToday, validateStayWindow } from './dates.js';
import { createCatalogRepository } from './repository.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Signature checks so an admin cannot store a non-image (or a file whose real
// type does not match the declared content type) that would later be served
// back to guests with a misleading Content-Type.
const imageSignatures = {
  'image/jpeg': (bytes) =>
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff,
  'image/png': (bytes) =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a,
  'image/webp': (bytes) =>
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP',
};

function notFound(resource) {
  return new HttpError(404, 'NOT_FOUND', `${resource} was not found.`);
}

function conflict(code, message) {
  return new HttpError(409, code, message);
}

function translateUniqueViolation(error, code, message) {
  if (error.code === '23505') throw conflict(code, message);
  throw error;
}

export function createCatalogService({ database, now = () => new Date() }) {
  const repository = createCatalogRepository(database);

  function stayFrom(criteria) {
    return validateStayWindow(criteria, dateOnlyToday(now()));
  }

  async function listRooms(hotelId, criteria) {
    const hotel = await repository.findPublicHotel(hotelId);
    if (!hotel) throw notFound('Hotel');
    return repository.listPublicRooms(hotelId, stayFrom(criteria));
  }

  return {
    async searchHotels(criteria) {
      return repository.searchHotels({
        city: criteria.city,
        stay: stayFrom(criteria),
      });
    },

    async getHotel(id) {
      const hotel = await repository.findPublicHotel(id);
      if (!hotel) throw notFound('Hotel');
      return hotel;
    },

    async listAdminHotels() {
      return repository.listActiveHotelsForAdmin();
    },

    async storeImage({ contentType, data }) {
      const bytes = Buffer.from(data, 'base64');
      if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES)
        throw new HttpError(
          400,
          'INVALID_IMAGE',
          'The image must be between 1 byte and 5 MB.',
        );
      const matchesSignature = imageSignatures[contentType];
      if (!matchesSignature || !matchesSignature(bytes))
        throw new HttpError(
          400,
          'INVALID_IMAGE',
          'The uploaded file is not a valid image of the declared type.',
        );
      const id = await repository.insertImage({
        contentType,
        byteSize: bytes.length,
        bytes,
      });
      return { url: `/api/images/${id}` };
    },

    async getImage(id) {
      const image = await repository.findImage(id);
      if (!image) throw notFound('Image');
      return {
        contentType: image.content_type,
        bytes: Buffer.from(image.bytes),
      };
    },

    async createHotel(input) {
      try {
        return await repository.createHotel(input);
      } catch (error) {
        translateUniqueViolation(
          error,
          'HOTEL_ALREADY_EXISTS',
          'A hotel with this name already exists in this city.',
        );
      }
    },

    async updateHotel(id, input) {
      try {
        const hotel = await repository.updateHotel(id, input);
        if (!hotel) throw notFound('Hotel');
        return hotel;
      } catch (error) {
        if (error instanceof HttpError) throw error;
        translateUniqueViolation(
          error,
          'HOTEL_ALREADY_EXISTS',
          'A hotel with this name already exists in this city.',
        );
      }
    },

    async deleteHotel(id) {
      await withTransaction(database, async (client) => {
        const hotel = await repository.findActiveHotelForUpdate(client, id);
        if (!hotel) throw notFound('Hotel');
        await repository.lockHotelRooms(client, id);
        await repository.deactivateHotel(client, id);
      });
    },

    async listRooms(hotelId, criteria) {
      return listRooms(hotelId, criteria);
    },

    async availability(criteria) {
      const rooms = await listRooms(criteria.hotelId, criteria);
      return rooms.filter((room) => room.available);
    },

    async createRoom(hotelId, input) {
      try {
        return await withTransaction(database, async (client) => {
          const hotel = await repository.findActiveHotelForUpdate(
            client,
            hotelId,
          );
          if (!hotel) throw notFound('Hotel');
          return repository.createRoom(client, hotelId, input);
        });
      } catch (error) {
        if (error instanceof HttpError) throw error;
        translateUniqueViolation(
          error,
          'ROOM_ALREADY_EXISTS',
          'A room type with this name already exists at this hotel.',
        );
      }
    },

    async updateRoom(id, input) {
      try {
        return await withTransaction(database, async (client) => {
          const room = await repository.findActiveRoomForUpdate(client, id);
          if (!room) throw notFound('Room');
          const required = await repository.requiredFutureInventory(
            client,
            id,
            dateOnlyToday(now()),
          );
          if (
            input.totalRooms < required.maximumOccupancy ||
            input.capacity < required.maximumGuests
          )
            throw conflict(
              'ROOM_INVENTORY_CONFLICT',
              'The room changes conflict with confirmed reservations.',
            );
          return repository.updateRoom(client, id, input);
        });
      } catch (error) {
        if (error instanceof HttpError) throw error;
        translateUniqueViolation(
          error,
          'ROOM_ALREADY_EXISTS',
          'A room type with this name already exists at this hotel.',
        );
      }
    },

    async deleteRoom(id) {
      await withTransaction(database, async (client) => {
        const room = await repository.findActiveRoomForUpdate(client, id);
        if (!room) throw notFound('Room');
        await repository.deactivateRoom(client, id);
      });
    },
  };
}
