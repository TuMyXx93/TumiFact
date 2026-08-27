import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import app from '../../src/app';
import { closeRedis, initRedis } from '../../src/config/redis';
import { pool } from '../../src/db';

const api = request(app);
let oldRefresh = '';
let accessCookie = '';

before(async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE, family_id UUID NOT NULL, expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP, replaced_by UUID, ip_address VARCHAR(64), user_agent VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(), last_used_at TIMESTAMP
  )`);
  await initRedis();
});

after(async () => {
  await closeRedis();
  await pool.end();
});

describe('TumiFact TypeScript API security runtime', () => {
  it('exposes health and correlation identifiers', async () => {
    const response = await api.get('/health').set('x-correlation-id', 'api-test-1');
    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'ok');
    assert.equal(response.headers['x-correlation-id'], 'api-test-1');
  });

  it('reports database and Redis readiness independently', async () => {
    const response = await api.get('/ready');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.dependencies, { database: true, redis: true });
  });

  it('logs in with an HttpOnly access and refresh cookie', async () => {
    const response = await api
      .post('/api/auth/login')
      .send({ credential: 'admin@tumifact.com', password: 'Password*2026' });
    assert.equal(response.status, 200);
    assert.ok(
      response.headers['set-cookie']?.some((cookie: string) => cookie.startsWith('tumifact_token='))
    );
    accessCookie = response.headers['set-cookie']!.find((cookie: string) =>
      cookie.startsWith('tumifact_token=')
    )!.split(';')[0];
    const refreshCookie = response.headers['set-cookie']?.find((cookie: string) =>
      cookie.startsWith('tumifact_refresh=')
    );
    assert.ok(refreshCookie);
    oldRefresh = refreshCookie!.split(';')[0];
  });

  it('rotates refresh and rejects replay', async () => {
    const rotated = await api
      .post('/api/auth/refresh')
      .set('Cookie', oldRefresh)
      .set('Origin', 'http://localhost:4321');
    assert.equal(rotated.status, 200);
    const replay = await api
      .post('/api/auth/refresh')
      .set('Cookie', oldRefresh)
      .set('Origin', 'http://localhost:4321');
    assert.equal(replay.status, 401);
    assert.equal(replay.body.code, 'AUTH_REFRESH_REJECTED');
  });

  it('rejects cookie mutations without an allowed origin', async () => {
    const response = await api.post('/api/auth/logout').set('Cookie', accessCookie);
    assert.equal(response.status, 403);
    assert.equal(response.body.code, 'CSRF_ORIGIN_REJECTED');
  });
});
