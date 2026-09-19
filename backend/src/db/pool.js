import pg from 'pg';
import { readDatabaseEnvironment } from './config.js';

const { Pool } = pg;

// Return DATE (OID 1082) values as raw YYYY-MM-DD strings. node-pg otherwise
// parses them into JS Date instances at local midnight, which shifts the
// calendar day backward when the process runs in a positive UTC offset (for
// example TZ=Asia/Tokyo). Reservation check-in and check-out are calendar days,
// not instants, so the string form is both correct and timezone-independent.
pg.types.setTypeParser(1082, (value) => value);

export function createDatabasePool(config = readDatabaseEnvironment()) {
  return new Pool({
    connectionString: config.connectionString,
    ssl: config.ssl ? { rejectUnauthorized: true } : false,
    max: config.poolMax,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    allowExitOnIdle: true,
  });
}

export async function withDatabaseClient(pool, work) {
  const client = await pool.connect();
  try {
    return await work(client);
  } finally {
    client.release();
  }
}

export async function withTransaction(pool, work) {
  if (typeof pool.connect !== 'function') {
    await pool.query('BEGIN');
    try {
      const result = await work(pool);
      await pool.query('COMMIT');
      return result;
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }
  return withDatabaseClient(pool, async (client) => {
    await client.query('BEGIN');
    try {
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}
