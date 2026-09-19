import { describe, expect, it } from 'vitest';
import pg from 'pg';
// Importing the pool module registers the DATE type parser as a side effect.
import '../../src/db/pool.js';

describe('pg DATE type parser', () => {
  it('returns DATE (OID 1082) values as raw YYYY-MM-DD strings', () => {
    // node-pg would otherwise parse these into local-midnight Date instances,
    // shifting the calendar day in positive-UTC-offset runtimes.
    const parse = pg.types.getTypeParser(1082);
    expect(parse('2026-10-10')).toBe('2026-10-10');
  });
});
