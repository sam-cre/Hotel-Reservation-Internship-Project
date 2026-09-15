import { z } from 'zod';

const name = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .refine((value) =>
    Array.from(value).every((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint >= 32 && codePoint !== 127;
    }),
  );
const email = z.string().trim().toLowerCase().email().max(320);
const password = z.string().min(12).max(256);

export const registrationSchema = z.object({ name, email, password }).strict();

export const loginSchema = z.object({ email, password }).strict();
