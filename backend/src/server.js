import { createApp } from './app.js';
import { readEnvironment } from './config/environment.js';

const config = readEnvironment();
const server = createApp().listen(config.PORT, config.HOST, () => {
  console.info(`API listening on http://${config.HOST}:${config.PORT}`);
});
server.on('error', (error) => {
  console.error(`API startup failed (${error.code ?? 'UNKNOWN'}).`);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
