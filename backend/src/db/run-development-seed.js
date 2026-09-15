import { readFile } from 'node:fs/promises';
import { createDatabasePool, withTransaction } from './pool.js';
import { developmentSeedPath } from './paths.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Development seed cannot run in production.');
}

const sql = await readFile(developmentSeedPath, 'utf8');
const pool = createDatabasePool();
try {
  await withTransaction(pool, (client) => client.query(sql));
  console.info('Development data seeded.');
} finally {
  await pool.end();
}
