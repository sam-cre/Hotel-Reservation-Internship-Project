import { createDatabasePool, withDatabaseClient } from './pool.js';
import { applyMigrations, loadMigrations } from './migrations.js';
import { migrationsDirectory } from './paths.js';

const pool = createDatabasePool();
try {
  const migrations = await loadMigrations(migrationsDirectory);
  const count = await withDatabaseClient(pool, (client) =>
    applyMigrations(client, migrations),
  );
  console.info(`Database migrations complete. Applied: ${count}.`);
} finally {
  await pool.end();
}
