import {
  readAdministratorEnvironment,
  readDatabaseEnvironment,
} from './config.js';
import { createDatabasePool, withTransaction } from './pool.js';
import { provisionAdministrator } from './provision-admin.js';

const database = readDatabaseEnvironment();
const administrator = readAdministratorEnvironment();
const pool = createDatabasePool(database);
try {
  const result = await withTransaction(pool, (client) =>
    provisionAdministrator(client, administrator),
  );
  console.info(
    result.created
      ? 'Administrator account created.'
      : 'Administrator account updated.',
  );
} finally {
  await pool.end();
}
