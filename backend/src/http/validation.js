import { ZodError } from 'zod';
import { HttpError } from './errors.js';

export function parseRequest(schema, value) {
  try {
    return schema.parse(value);
  } catch (error) {
    if (!(error instanceof ZodError)) throw error;
    const fields = [
      ...new Set(
        error.issues
          .flatMap((issue) =>
            issue.code === 'unrecognized_keys' ? issue.keys : issue.path[0],
          )
          .filter((field) => typeof field === 'string'),
      ),
    ];
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request is invalid.', {
      fields,
    });
  }
}
