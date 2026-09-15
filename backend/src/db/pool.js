import pg from 'pg';
import { readDatabaseEnvironment } from './config.js';

const { Pool } = pg;

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
