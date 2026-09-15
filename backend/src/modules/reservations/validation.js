import { z } from 'zod';
import { identifierSchema } from '../catalog/validation.js';

const maximumInteger = 2147483647;

function isCalendarDate(value) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isCalendarDate);

export const reservationMutationSchema = z
  .object({
    roomId: identifierSchema,
    checkIn: dateSchema,
    checkOut: dateSchema,
    guests: z.number().int().min(1).max(maximumInteger),
  })
  .strict();

export const idempotencyHeaderSchema = z
  .object({ idempotencyKey: z.string().uuid() })
  .strict();

export const reservationIdParamsSchema = z
  .object({ id: identifierSchema })
  .strict();

export const reservationListSchema = z
  .object({ status: z.enum(['confirmed', 'cancelled']).optional() })
  .strict();

export const reservationStatusSchema = z
  .object({ status: z.literal('cancelled') })
  .strict();
