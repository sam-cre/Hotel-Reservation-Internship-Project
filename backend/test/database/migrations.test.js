import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyMigrations, loadMigrations } from '../../src/db/migrations.js';
import { migrationsDirectory } from '../../src/db/paths.js';

const temporaryDirectories = [];

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('migration discovery', () => {
  it('loads ordered migrations with stable SHA-256 checksums', async () => {
    const migrations = await loadMigrations(migrationsDirectory);
    expect(migrations.map((migration) => migration.version)).toEqual(['001']);
    expect(migrations[0].name).toBe('001_initial_schema.sql');
    expect(migrations[0].checksum).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects an invalid migration filename', async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), 'stillwater-migration-'),
    );
    temporaryDirectories.push(directory);
    await writeFile(path.join(directory, 'initial.sql'), 'SELECT 1', 'utf8');
    await expect(loadMigrations(directory)).rejects.toThrow(
      'Invalid migration filename: initial.sql',
    );
  });

  it('rejects duplicate migration versions', async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), 'stillwater-migration-'),
    );
    temporaryDirectories.push(directory);
    await writeFile(path.join(directory, '001_first.sql'), 'SELECT 1', 'utf8');
    await writeFile(path.join(directory, '001_second.sql'), 'SELECT 2', 'utf8');
    await expect(loadMigrations(directory)).rejects.toThrow(
      'Duplicate migration version: 001',
    );
  });

  it('records each migration once and makes repeat runs a no-op', async () => {
    const { PGlite } = await import('@electric-sql/pglite');
    const database = new PGlite();
    try {
      const migrations = await loadMigrations(migrationsDirectory);
      await expect(
        applyMigrations(database, migrations, { useAdvisoryLock: false }),
      ).resolves.toBe(1);
      await expect(
        applyMigrations(database, migrations, { useAdvisoryLock: false }),
      ).resolves.toBe(0);
      const applied = await database.query(
        'SELECT version, name, checksum FROM schema_migrations',
      );
      expect(applied.rows).toEqual([
        expect.objectContaining({
          version: '001',
          name: '001_initial_schema.sql',
        }),
      ]);
      expect(applied.rows[0].checksum).toMatch(/^[0-9a-f]{64}$/);
    } finally {
      await database.close();
    }
  });

  it('refuses to run when an applied migration checksum changes', async () => {
    const { PGlite } = await import('@electric-sql/pglite');
    const database = new PGlite();
    try {
      const migrations = await loadMigrations(migrationsDirectory);
      await applyMigrations(database, migrations, { useAdvisoryLock: false });
      const changed = [{ ...migrations[0], checksum: 'f'.repeat(64) }];
      await expect(
        applyMigrations(database, changed, { useAdvisoryLock: false }),
      ).rejects.toThrow('Applied migration 001 has changed on disk.');
    } finally {
      await database.close();
    }
  });
});
