import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/db';
import { truncateAll } from './helpers';

async function loginAsAdmin() {
  const res = await request(app)
    .post('/api/auth/login')
    .set('Accept', 'application/vnd.tumifact.auth+json')
    .send({ credential: 'admin@tumifact.com', password: 'Password*2026' });
  if (res.status !== 200)
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  const token = res.body.token as string | undefined;
  if (token) return { authHeader: `Bearer ${token}` } as const;
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const tokenCookie =
    cookies?.find((c: string) => c.startsWith('tumifact_token='))?.split(';')[0] || '';
  return { cookie: tokenCookie } as const;
}

function withAuth(req: any, auth: any) {
  if (auth.authHeader) req.set('Authorization', auth.authHeader);
  if (auth.cookie) req.set('Cookie', auth.cookie);
  return req;
}

describe('Inventario — Stack TS (Vitest + src/app)', () => {
  let productoId: number;

  beforeEach(async () => {
    await truncateAll();
    const pRes = await pool.query(
      `INSERT INTO productos (codigo, nombre, precio_unidad, stock_actual, stock_minimo) VALUES ('INV-001', 'Producto Kardex', 5000, 20, 5) RETURNING id`
    );
    productoId = pRes.rows[0].id;
  });

  it('lista movimientos con admin → 200', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).get('/api/inventario/movimientos'), auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('rechaza movimientos sin auth → 401', async () => {
    const res = await request(app).get('/api/inventario/movimientos');
    expect(res.status).toBe(401);
  });

  it('registra entrada de stock con admin → 201 y actualiza stock', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).post('/api/inventario/movimientos'), auth)
      .set('Idempotency-Key', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e')
      .send({
        producto_id: productoId,
        tipo: 'entrada_manual',
        cantidad: 10,
        costo_unitario: 2000,
        notas: 'Compra proveedor',
      });
    expect(res.status).toBe(201);

    // Verificar stock actualizado
    const pRes = await pool.query(`SELECT stock_actual FROM productos WHERE id = $1`, [productoId]);
    expect(parseFloat(pRes.rows[0].stock_actual)).toBe(30);
  });

  it('stock-critico lista productos bajo mínimo → 200', async () => {
    const auth = await loginAsAdmin();
    // Bajar stock por debajo del mínimo
    await pool.query(`UPDATE productos SET stock_actual = 2 WHERE id = $1`, [productoId]);
    const res = await withAuth(request(app).get('/api/inventario/stock-critico'), auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('ajuste-rapido con admin → 200', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).post('/api/inventario/ajuste-rapido'), auth).send({
      producto_id: productoId,
      nuevo_stock: 100,
      motivo: 'Conteo físico anual',
    });
    expect([200, 201]).toContain(res.status);
    const pRes = await pool.query(`SELECT stock_actual FROM productos WHERE id = $1`, [productoId]);
    expect(parseFloat(pRes.rows[0].stock_actual)).toBe(100);
  });
});
