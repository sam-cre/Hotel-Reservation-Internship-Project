import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  readAdministratorEnvironment,
  readDatabaseEnvironment,
} from '../../src/db/config.js';
import { withDatabaseClient, withTransaction } from '../../src/db/pool.js';

describe('database environment', () => {
  it('parses a bounded pool and explicit local TLS setting', () => {
    expect(
      readDatabaseEnvironment({
        DATABASE_URL: 'postgresql://localhost:5432/stillwater_test',
        DATABASE_SSL: 'disable',
        DATABASE_POOL_MAX: '4',
      }),
    ).toEqual({
      connectionString: 'postgresql://localhost:5432/stillwater_test',
      ssl: false,
      poolMax: 4,
    });
  });

  it('rejects invalid settings without echoing credentials', () => {
    expect(() =>
      readDatabaseEnvironment({ DATABASE_URL: 'private-input' }),
    ).toThrow('Invalid database environment configuration: DATABASE_URL');
    try {
      readDatabaseEnvironment({ DATABASE_URL: 'private-input' });
    } catch (error) {
      expect(error.message).not.toContain('private-input');
    }
  });

  it('normalizes administrator identity and requires a strong input length', () => {
    expect(
      readAdministratorEnvironment({
        ADMIN_NAME: ' Stillwater Operator ',
        ADMIN_EMAIL: 'ADMIN@EXAMPLE.COM ',
        ADMIN_PASSWORD: 'long-test-password',
      }),
    ).toEqual({
      name: 'Stillwater Operator',
      email: 'admin@example.com',
      password: 'long-test-password',
    });
    expect(() =>
      readAdministratorEnvironment({
        ADMIN_NAME: 'Operator',
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_PASSWORD: 'short',
      }),
    ).toThrow(
      'Invalid administrator provisioning configuration: ADMIN_PASSWORD',
    );
  });

  it('refuses to load development seed data in production', () => {
    const script = fileURLToPath(
      new URL('../../src/db/run-development-seed.js', import.meta.url),
    );
    const result = spawnSync(process.execPath, [script], {
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://private-input@localhost:1/stillwater',
      },
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Development seed cannot run in production.',
    );
    expect(result.stderr).not.toContain('private-input');
  });
});

describe('database client lifecycle', () => {
  it('always releases an acquired client', async () => {
    const client = { release: vi.fn() };
    const pool = { connect: vi.fn().mockResolvedValue(client) };
    await expect(
      withDatabaseClient(pool, async () => {
        throw new Error('work failed');
      }),
    ).rejects.toThrow('work failed');
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('commits successful work and releases the client', async () => {
    const client = { query: vi.fn(), release: vi.fn() };
    const pool = { connect: vi.fn().mockResolvedValue(client) };
    await expect(withTransaction(pool, async () => 'done')).resolves.toBe(
      'done',
    );
    expect(client.query.mock.calls.map(([sql]) => sql)).toEqual([
      'BEGIN',
      'COMMIT',
    ]);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('rolls back failed work and releases the client', async () => {
    const client = { query: vi.fn(), release: vi.fn() };
    const pool = { connect: vi.fn().mockResolvedValue(client) };
    await expect(
      withTransaction(pool, async () => {
        throw new Error('transaction failed');
      }),
    ).rejects.toThrow('transaction failed');
    expect(client.query.mock.calls.map(([sql]) => sql)).toEqual([
      'BEGIN',
      'ROLLBACK',
    ]);
    expect(client.release).toHaveBeenCalledOnce();
  });
});
