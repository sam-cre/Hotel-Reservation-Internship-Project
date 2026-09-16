import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { createApp } from '../backend/src/app.js';
import { readEnvironment } from '../backend/src/config/environment.js';

const root = fileURLToPath(new URL('../', import.meta.url));

async function withDeadline(label, work, milliseconds = 5000) {
  let timeout;
  try {
    return await Promise.race([
      work,
      new Promise((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(`${label} did not finish within ${milliseconds}ms`),
            ),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

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
assert.match(example, /^JWT_SECRET=$/m);
assert.match(example, /^ALLOWED_ORIGINS=http:\/\/127\.0\.0\.1:5173,/m);
assert(!/^JWT_SECRET=.+$/m.test(example));
assert.equal(readEnvironment({}).PORT, 3001);
assert.equal(readEnvironment({}).TRUST_PROXY_HOPS, 0);
console.info('environment and Git exclusions verified');

const api = createApp().listen(0, '127.0.0.1');
await once(api, 'listening');
let frontend;
let forceVerificationExit = false;
let cleanupError;
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
  assert.match(await entry.text(), /CustomerApplication/);
  const customer = await fetch(
    `${origin}/src/features/customer/SearchPage.jsx`,
  );
  assert.equal(customer.status, 200);
  assert.match(await customer.text(), /Hotels worth arriving for/);
  const administrator = await fetch(
    `${origin}/src/features/admin/AdminApplication.jsx`,
  );
  assert.equal(administrator.status, 200);
  assert.match(await administrator.text(), /Administrator access required/);
  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
  const missing = await fetch(`${origin}/api/missing`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, 'NOT_FOUND');
  console.info('frontend serving and backend API proxy verified');
} finally {
  frontend?.httpServer?.closeAllConnections?.();
  api.closeAllConnections?.();
  try {
    await withDeadline('Vite server cleanup', frontend?.close());
  } catch (error) {
    if (
      String(error.message).startsWith('Vite server cleanup did not finish')
    ) {
      forceVerificationExit = true;
      console.warn(
        'Vite retained an internal watcher after its HTTP connections closed; the verification process will exit explicitly.',
      );
    } else {
      cleanupError = error;
    }
  }
  try {
    await withDeadline(
      'API server cleanup',
      new Promise((resolve, reject) =>
        api.close((error) => (error ? reject(error) : resolve())),
      ),
    );
  } catch (error) {
    cleanupError ??= error;
  }
  console.info('verification servers closed');
}

if (cleanupError) throw cleanupError;
if (forceVerificationExit) process.exit(0);
