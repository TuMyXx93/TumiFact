import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';

describe('reports', () => {
  it('returns sales report with auth', async () => {
    const app = await buildApp();
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { credential: 'admin@tumifact.com', password: 'Password*2026' },
    });
    const token = login.json().token;

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/sales',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().meta).toBeDefined();
    await app.close();
  });

  it('rejects without auth', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/v1/reports/sales' });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
