import { fileURLToPath } from 'node:url';

export const migrationsDirectory = fileURLToPath(
  new URL('../../migrations/', import.meta.url),
);

export const developmentSeedPath = fileURLToPath(
  new URL('../../seeds/development.sql', import.meta.url),
);
