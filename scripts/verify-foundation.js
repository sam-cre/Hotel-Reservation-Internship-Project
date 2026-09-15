import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { createApp } from '../backend/src/app.js';
import { readEnvironment } from '../backend/src/config/environment.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const ignored = [
  '.env',
  '.env.production',
  'backend/.env',
  'frontend/.env.local',
  'private.key',
  'certificate.pfx',
  'node_modules/example.js',
  'frontend/dist/index.html',
  'tmp/pdfs/assignment-1.png',
  '.security-audit/report.md',
];
for (const path of ignored) {
  execFileSync('git', ['check-ignore', '--no-index', '--quiet', '--', path], {
    cwd: root,
  });
}
const visible = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { cwd: root, encoding: 'utf8' },
).split(/\r?\n/);
assert(
  visible.includes('.env.example'),
  'Environment example must be visible to Git',
);
assert(
  !visible.some(
    (path) =>
      path === 'AGENTS.md' ||
      path.startsWith('local-workspace/') ||
      path.endsWith('.pdf'),
  ),
  'Local-only files must stay outside Git',
);
const example = await readFile(
  new URL('../.env.example', import.meta.url),
  'utf8',
);
assert(!/postgres(?:ql)?:\/\/[^\s]+:[^\s]+@/.test(example));
assert.equal(readEnvironment({}).PORT, 3001);
console.info('environment and Git exclusions verified');

const api = createApp().listen(0, '127.0.0.1');
await once(api, 'listening');
let frontend;
try {
  const target = `http://127.0.0.1:${api.address().port}`;
  frontend = await createServer({
    root: fileURLToPath(new URL('../frontend', import.meta.url)),
    server: {
      host: '127.0.0.1',
      port: 0,
      strictPort: false,
      proxy: { '/api': { target } },
    },
    logLevel: 'error',
  });
  await frontend.listen();
  const origin = `http://127.0.0.1:${frontend.httpServer.address().port}`;
  const page = await fetch(origin);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Stillwater Hotels/);
  const entry = await fetch(`${origin}/src/App.jsx`);
  assert.equal(entry.status, 200);
  assert.match(await entry.text(), /Hotels worth arriving for/);
  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
  const missing = await fetch(`${origin}/api/missing`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, 'NOT_FOUND');
  console.info('frontend serving and backend API proxy verified');
} finally {
  await frontend?.close();
  await new Promise((resolve, reject) =>
    api.close((error) => (error ? reject(error) : resolve())),
  );
}
