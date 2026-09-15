import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const migrationName = /^(\d{3})_([a-z0-9_]+)\.sql$/;
const lockName = 'stillwater_schema_migrations';

async function executeMigration(client, sql) {
  if (typeof client.exec === 'function') return client.exec(sql);
  return client.query(sql);
}

export async function loadMigrations(directory) {
  const names = (await readdir(directory))
    .filter((name) => name.endsWith('.sql'))
    .sort();
  const versions = new Set();
  const migrations = [];
  for (const name of names) {
    const match = migrationName.exec(name);
    if (!match) throw new Error(`Invalid migration filename: ${name}`);
    const [, version] = match;
    if (versions.has(version))
      throw new Error(`Duplicate migration version: ${version}`);
    versions.add(version);
    const sql = await readFile(path.join(directory, name), 'utf8');
    migrations.push({
      version,
      name,
      sql,
      checksum: createHash('sha256').update(sql).digest('hex'),
    });
  }
  if (migrations.length === 0) throw new Error('No migration files found.');
  return migrations;
}

export async function applyMigrations(
  client,
  migrations,
  { useAdvisoryLock = true } = {},
) {
  if (useAdvisoryLock)
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [lockName]);
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        name text NOT NULL,
        checksum character(64) NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const applied = await client.query(
      'SELECT version, checksum FROM schema_migrations ORDER BY version',
    );
    const appliedByVersion = new Map(
      applied.rows.map((row) => [row.version, row.checksum]),
    );
    let count = 0;
    for (const migration of migrations) {
      const existingChecksum = appliedByVersion.get(migration.version);
      if (existingChecksum) {
        if (existingChecksum !== migration.checksum)
          throw new Error(
            `Applied migration ${migration.version} has changed on disk.`,
          );
        continue;
      }
      await client.query('BEGIN');
      try {
        await executeMigration(client, migration.sql);
        await client.query(
          'INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
          [migration.version, migration.name, migration.checksum],
        );
        await client.query('COMMIT');
        count += 1;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    return count;
  } finally {
    if (useAdvisoryLock)
      await client.query('SELECT pg_advisory_unlock(hashtext($1))', [lockName]);
  }
}
