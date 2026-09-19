import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { applyMigrations, loadMigrations } from '../../src/db/migrations.js';
import {
  developmentSeedPath,
  migrationsDirectory,
} from '../../src/db/paths.js';
import { createDatabasePool, withDatabaseClient } from '../../src/db/pool.js';

const connectionString = process.env.TEST_DATABASE_URL;
const runIntegration = Boolean(connectionString);
let pool;

function requireTestDatabase(value) {
  const databaseName = new URL(value).pathname.slice(1);
  if (
    process.env.NODE_ENV !== 'test' ||
    !/^(test_.+|.+_test)$/.test(databaseName.toLowerCase())
  ) {
    throw new Error(
      'TEST_DATABASE_URL requires NODE_ENV=test and a test_ prefix or _test suffix.',
    );
  }
}

async function clearTestSchema() {
  await withDatabaseClient(pool, (client) =>
    client.query(`
      DROP TABLE IF EXISTS
        schema_migrations,
        reservations,
        rooms,
        hotel_images,
        hotels,
        users
      CASCADE
    `),
  );
}

describe.skipIf(!runIntegration)('PostgreSQL server integration', () => {
  beforeAll(async () => {
    requireTestDatabase(connectionString);
    pool = createDatabasePool({
      connectionString,
      ssl: false,
      poolMax: 2,
    });
    await clearTestSchema();
  });

  afterAll(async () => {
    if (!pool) return;
    await clearTestSchema();
    await pool.end();
  });

  it('migrates and seeds a normal PostgreSQL server idempotently', async () => {
    const migrations = await loadMigrations(migrationsDirectory);
    await expect(
      withDatabaseClient(pool, (client) => applyMigrations(client, migrations)),
    ).resolves.toBe(4);
    await expect(
      withDatabaseClient(pool, (client) => applyMigrations(client, migrations)),
    ).resolves.toBe(0);
    const seed = await readFile(developmentSeedPath, 'utf8');
    await withDatabaseClient(pool, (client) => client.query(seed));
    await withDatabaseClient(pool, (client) => client.query(seed));
    const result = await withDatabaseClient(pool, (client) =>
      client.query(`
        SELECT
          (SELECT count(*)::integer FROM hotels) AS hotels,
          (SELECT count(*)::integer FROM rooms) AS rooms,
          (SELECT count(*)::integer FROM schema_migrations) AS migrations
      `),
    );
    expect(result.rows[0]).toEqual({ hotels: 9, rooms: 18, migrations: 4 });
  });
});
