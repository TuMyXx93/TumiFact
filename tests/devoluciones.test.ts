import request from 'supertest';
import app from '../src/app';
import { truncateAll } from './helpers';
import { pool } from '../src/db';

async function loginAsAdmin() {
  const res = await request(app)
    .post('/api/auth/login')
    .set('Accept', 'application/vnd.tumifact.auth+json')
    .send({ credential: 'admin@tumifact.com', password: 'Password*2026' });
  if (res.status !== 200) throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  const token = res.body.token as string | undefined;
  if (token) return { authHeader: `Bearer ${token}` } as const;
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const tokenCookie = cookies?.find((c: string) => c.startsWith('tumifact_token='))?.split(';')[0] || '';
  return { cookie: tokenCookie } as const;
}

function withAuth(req: any, auth: any) {
  if (auth.authHeader) req.set('Authorization', auth.authHeader);
  if (auth.cookie) req.set('Cookie', auth.cookie);
  return req;
}

describe('Devoluciones — Stack TS (Vitest + src/app)', () => {
  let facturaId: number;
  let productoId: number;

  beforeEach(async () => {
    await truncateAll();
    // Seed factura completa con detalle para devolver
    const pRes = await pool.query(
      `INSERT INTO productos (codigo, nombre, precio_unidad, stock_actual) VALUES ('DEV-001', 'Producto Dev', 10000, 10) RETURNING id`
    );
    productoId = pRes.rows[0].id;

    const cRes = await pool.query(`INSERT INTO clientes (nombre) VALUES ('Cliente Dev') RETURNING id`);
    const fRes = await pool.query(
      `INSERT INTO facturas (cliente_id, usuario_id, subtotal, total, forma_pago, estado) VALUES ($1, 1, 20000, 20000, 'efectivo', 'completada') RETURNING id`,
      [cRes.rows[0].id]
    );
    facturaId = fRes.rows[0].id;

    await pool.query(
      `INSERT INTO detalle_factura (factura_id, producto_id, cantidad, precio_unitario, unidad_medida, subtotal) VALUES ($1, $2, 2, 10000, 'UND', 20000)`,
      [facturaId, productoId]
    );
  });

  it('lista devoluciones vacía → 200', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).get('/api/devoluciones'), auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('rechaza lista sin auth → 401', async () => {
    const res = await request(app).get('/api/devoluciones');
    expect(res.status).toBe(401);
  });

  it('crea devolución parcial con admin → 201', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).post('/api/devoluciones'), auth)
      .set('Idempotency-Key', 'c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7a')
      .send({
        factura_id: facturaId,
        tipo: 'devolucion_parcial',
        motivo: 'Producto defectuoso',
        forma_devolucion: 'efectivo',
        items: [
          {
            producto_id: productoId,
            cantidad_devuelta: 1,
            precio_unitario: 10000,
            condicion: 'defectuoso',
            reingresa_inventario: true
          }
        ]
      });
    if (res.status !== 201) console.log('DEV DEBUG', res.status, JSON.stringify(res.body, null, 2));
    expect([200, 201]).toContain(res.status);
  });

  it('detalle de devolución inexistente → 404', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).get('/api/devoluciones/9999'), auth);
    expect(res.status).toBe(404);
  });

  it('rechaza crear sin auth → 401', async () => {
    const res = await request(app).post('/api/devoluciones').send({
      factura_id: facturaId,
      tipo: 'devolucion_total',
      motivo: 'test'
    });
    expect(res.status).toBe(401);
  });
});
