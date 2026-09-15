import { createApp } from './app.js';
import { readAuthenticationEnvironment } from './config/authentication.js';
import { readEnvironment } from './config/environment.js';
import { readDatabaseEnvironment } from './db/config.js';
import { createDatabasePool } from './db/pool.js';

const config = readEnvironment();
const databaseConfig = readDatabaseEnvironment();
const authenticationConfig = readAuthenticationEnvironment();
const database = createDatabasePool(databaseConfig);
const authentication = {
  database,
  config: authenticationConfig,
};
const server = createApp({
  database,
  authentication,
  trustProxyHops: config.TRUST_PROXY_HOPS,
}).listen(config.PORT, config.HOST, () => {
  console.info(`API listening on http://${config.HOST}:${config.PORT}`);
});
server.on('error', (error) => {
  console.error(`API startup failed (${error.code ?? 'UNKNOWN'}).`);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(async () => {
      try {
        await database.end();
      } finally {
        process.exit(0);
      }
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
