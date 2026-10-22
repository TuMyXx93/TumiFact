import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { loginAs } from './helpers';

describe('reports', () => {
  it('returns sales report with auth', async () => {
    const app = await buildApp();
    const auth = await loginAs(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/sales',
      headers: { authorization: auth.authorization },
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
