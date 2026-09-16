import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { readEnvironment } from '../src/config/environment.js';

describe('backend foundation', () => {
  it('exposes process health without server internals and disables caching', async () => {
    const response = await request(createApp()).get('/api/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
  it('reports readiness when the database answers a probe query', async () => {
    const database = { query: async () => ({ rows: [{ '?column?': 1 }] }) };
    const response = await request(createApp({ database }))
      .get('/api/ready')
      .expect(200);
    expect(response.body).toEqual({ status: 'ready' });
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it('reports unavailable without leaking details when the database probe fails', async () => {
    const database = {
      query: async () => {
        throw new Error('connection refused to secret-host:5432');
      },
    };
    const response = await request(createApp({ database }))
      .get('/api/ready')
      .expect(503);
    expect(response.body).toEqual({ status: 'unavailable' });
    expect(response.text).not.toContain('secret-host');
  });
  it('omits the readiness probe when no database is configured', async () => {
    await request(createApp()).get('/api/ready').expect(404);
  });
  it('returns JSON for missing routes with a matching request identifier', async () => {
    const response = await request(createApp()).get('/api/missing').expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.requestId).toBe(
      response.headers['x-request-id'],
    );
  });
  it('does not reflect malformed request contents in errors', async () => {
    const response = await request(createApp())
      .post('/api/missing')
      .set('Content-Type', 'application/json')
      .send('{"password":"private-input",')
      .expect(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
    expect(response.text).not.toContain('private-input');
    expect(response.text).not.toContain('stack');
  });
  it('rejects oversized bodies', async () => {
    const response = await request(createApp())
      .post('/api/missing')
      .send({ value: 'x'.repeat(17000) })
      .expect(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe('environment validation', () => {
  it('provides local defaults without credentials', () => {
    expect(readEnvironment({})).toEqual({
      NODE_ENV: 'development',
      HOST: '127.0.0.1',
      PORT: 3001,
      TRUST_PROXY_HOPS: 0,
    });
  });
  it.each(['0', '-1', '65536', 'not-a-port', '3.5'])(
    'rejects invalid port %s',
    (PORT) => {
      expect(() => readEnvironment({ PORT })).toThrow(
        'Invalid environment configuration: PORT',
      );
    },
  );
  it('rejects invalid configuration without echoing its value', () => {
    expect(() => readEnvironment({ NODE_ENV: 'private-input' })).toThrow(
      'Invalid environment configuration: NODE_ENV',
    );
  });
  it.each(['-1', '3', 'not-a-number'])(
    'rejects invalid proxy hop count %s',
    (TRUST_PROXY_HOPS) => {
      expect(() => readEnvironment({ TRUST_PROXY_HOPS })).toThrow(
        'Invalid environment configuration: TRUST_PROXY_HOPS',
      );
    },
  );
});
