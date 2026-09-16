import { z } from 'zod';

const maximumInteger = 2147483647;
const maximumBigint = 9223372036854775807n;

function withoutControlCharacters(value) {
  return Array.from(value).every((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint >= 32 && codePoint !== 127;
  });
}

function text(maximum) {
  return z.string().trim().min(1).max(maximum).refine(withoutControlCharacters);
}

function hasPrecision(value, places) {
  const scale = 10 ** places;
  return Math.abs(value * scale - Math.round(value * scale)) < 1e-8;
}

function isCalendarDate(value) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function createImageUrlValidator(allowedHosts = new Set()) {
  return (value) => {
    // Same-origin managed asset paths are always allowed.
    if (value.startsWith('/') && !value.startsWith('//')) return true;
    let url;
    try {
      url = new URL(value);
    } catch {
      return false;
    }
    // Remote images must be HTTPS, carry no embedded credentials, and target a
    // host that has been explicitly approved. The allowlist is empty by
    // default, so arbitrary remote origins fail closed.
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    return allowedHosts.has(url.host);
  };
}

export const identifierSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .refine((value) => {
    try {
      return BigInt(value) <= maximumBigint;
    } catch {
      return false;
    }
  })
  .transform((value) => BigInt(value).toString());

export const hotelIdParamsSchema = z
  .object({ hotelId: identifierSchema })
  .strict();
export const idParamsSchema = z.object({ id: identifierSchema }).strict();

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isCalendarDate);
const queryInteger = z.coerce.number().int().min(1).max(maximumInteger);
const bodyInteger = z.number().int().min(1).max(maximumInteger);

const optionalStayShape = {
  checkIn: dateSchema.optional(),
  checkOut: dateSchema.optional(),
  guests: queryInteger.optional(),
};

function requireCompleteStay(value, context) {
  const fields = ['checkIn', 'checkOut', 'guests'];
  const present = fields.filter((field) => value[field] !== undefined);
  if (present.length === 0 || present.length === fields.length) return;
  for (const field of fields) {
    if (value[field] === undefined) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: 'Complete stay criteria are required.',
      });
    }
  }
}

export const hotelSearchSchema = z
  .object({ city: text(120).optional(), ...optionalStayShape })
  .strict()
  .superRefine(requireCompleteStay);

export const roomListSchema = z
  .object(optionalStayShape)
  .strict()
  .superRefine(requireCompleteStay);

export const availabilitySchema = z
  .object({
    hotelId: identifierSchema,
    checkIn: dateSchema,
    checkOut: dateSchema,
    guests: queryInteger,
  })
  .strict();

export function createHotelMutationSchema(imageHostAllowlist = new Set()) {
  const isImageUrl = createImageUrlValidator(imageHostAllowlist);
  return z
    .object({
      name: text(160),
      description: text(5000),
      city: text(120),
      address: text(300),
      rating: z
        .number()
        .finite()
        .min(0)
        .max(5)
        .refine((value) => hasPrecision(value, 1)),
      imageUrl: text(2048).refine(isImageUrl),
      amenities: z.array(text(60)).max(12).default([]),
    })
    .strict();
}

export const roomMutationSchema = z
  .object({
    name: text(160),
    description: text(5000),
    pricePerNight: z
      .number()
      .finite()
      .gt(0)
      .max(99999999.99)
      .refine((value) => hasPrecision(value, 2)),
    capacity: bodyInteger,
    totalRooms: bodyInteger,
  })
  .strict();
