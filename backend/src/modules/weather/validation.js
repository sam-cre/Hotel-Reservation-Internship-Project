import { z } from 'zod';

function withoutControlCharacters(value) {
  return Array.from(value).every((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint >= 32 && codePoint !== 127;
  });
}

export const weatherQuerySchema = z
  .object({
    city: z.string().trim().min(1).max(120).refine(withoutControlCharacters),
  })
  .strict();
