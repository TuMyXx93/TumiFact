import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';

describe('customers', () => {
  it('creates and lists customers', async () => {
    const app = await buildApp();
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/customers',
      payload: { nombre: 'Cliente Test' },
    });
    expect(create.statusCode).toBe(201);

    const list = await app.inject({ method: 'GET', url: '/api/v1/customers' });
    expect(list.statusCode).toBe(200);
    expect(Array.isArray(list.json().data)).toBe(true);
    await app.close();
  });
});
