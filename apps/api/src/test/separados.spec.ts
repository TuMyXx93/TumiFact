import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';

describe('separados', () => {
  it('creates a separado', async () => {
    const app = await buildApp();
    const productRes = await app.inject({ method: 'GET', url: '/api/v1/products' });
    const productId = productRes.json().data[0].id;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/separados',
      payload: {
        cliente_id: 1,
        descripcion: 'Sep test',
        valor_total: 500,
        abono_inicial: 200,
        productos: [{ producto_id: productId, cantidad: 1, precio_unitario: 500, subtotal: 500 }],
      },
    });

    expect(res.statusCode).toBe(201);
    await app.close();
  });
});
