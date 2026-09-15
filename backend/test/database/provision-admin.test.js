import { PGlite } from '@electric-sql/pglite';
import argon2 from 'argon2';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadMigrations } from '../../src/db/migrations.js';
import { migrationsDirectory } from '../../src/db/paths.js';
import { provisionAdministrator } from '../../src/db/provision-admin.js';

let database;

beforeEach(async () => {
  database = new PGlite();
  const migrations = await loadMigrations(migrationsDirectory);
  for (const migration of migrations) await database.exec(migration.sql);
});

afterEach(async () => {
  await database.close();
});

describe('administrator provisioning', () => {
  it('creates one administrator with an Argon2id password hash', async () => {
    const result = await provisionAdministrator(database, {
      name: 'Stillwater Operator',
      email: 'admin@example.com',
      password: 'long-test-password',
    });
    expect(result).toEqual({ created: true });
    const stored = await database.query(
      'SELECT name, email, password, role FROM users',
    );
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0]).toMatchObject({
      name: 'Stillwater Operator',
      email: 'admin@example.com',
      role: 'admin',
    });
    expect(stored.rows[0].password).not.toBe('long-test-password');
    expect(
      await argon2.verify(stored.rows[0].password, 'long-test-password'),
    ).toBe(true);
  });

  it('updates the same administrator without creating a duplicate', async () => {
    const initial = {
      name: 'Stillwater Operator',
      email: 'admin@example.com',
      password: 'long-test-password',
    };
    await provisionAdministrator(database, initial);
    const result = await provisionAdministrator(database, {
      ...initial,
      name: 'Updated Operator',
      password: 'another-test-password',
    });
    expect(result).toEqual({ created: false });
    const stored = await database.query(
      'SELECT name, password, count(*) OVER ()::integer AS count FROM users',
    );
    expect(stored.rows[0].name).toBe('Updated Operator');
    expect(stored.rows[0].count).toBe(1);
    expect(
      await argon2.verify(stored.rows[0].password, 'another-test-password'),
    ).toBe(true);
  });

  it('does not convert an existing customer into an administrator', async () => {
    await database.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ('Customer', 'customer@example.com', '$argon2id$test-placeholder-value', 'customer')`,
    );
    await expect(
      provisionAdministrator(database, {
        name: 'Attempted Operator',
        email: 'customer@example.com',
        password: 'long-test-password',
      }),
    ).rejects.toThrow(
      'Administrator email belongs to an existing customer account.',
    );
    const stored = await database.query(
      "SELECT role FROM users WHERE email = 'customer@example.com'",
    );
    expect(stored.rows[0].role).toBe('customer');
  });
});
