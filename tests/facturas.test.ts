import request from 'supertest';
import app from '../src/app';
import { truncateAll } from './helpers';

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

describe('Facturas — Stack TS (Vitest + src/app)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('crea una factura y devuelve 201 con total recalculado (auth + idempotencia)', async () => {
    const auth = await loginAsAdmin();

    const cliRes = await withAuth(request(app).post('/api/clientes'), auth).send({ nombre: 'Cliente Factura Test' });
    expect(cliRes.status).toBe(201);
    const clienteId = cliRes.body.id;

    const prodRes = await withAuth(request(app).post('/api/productos'), auth).send({
      codigo: 'TEST-001',
      nombre: 'Producto Test',
      precio_kg: 15000
    });
    expect(prodRes.status).toBe(201);
    const productoId = prodRes.body.id;

    const res = await withAuth(request(app).post('/api/facturas'), auth).send({
      cliente_id: clienteId,
      total: 75000,
      forma_pago: 'efectivo',
      productos: [{ producto_id: productoId, cantidad: 5, precio: 15000, unidad: 'KG' }]
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.total).toBeDefined();
  });

  it('rechaza total manipulado con 400', async () => {
    const auth = await loginAsAdmin();

    const cliRes = await withAuth(request(app).post('/api/clientes'), auth).send({ nombre: 'Cliente Factura Test 2' });
    const clienteId = cliRes.body.id;

    const prodRes = await withAuth(request(app).post('/api/productos'), auth).send({
      codigo: 'TEST-002',
      nombre: 'Producto Test 2',
      precio_kg: 1000
    });
    const productoId = prodRes.body.id;

    const res = await withAuth(request(app).post('/api/facturas'), auth).send({
      cliente_id: clienteId,
      total: 99999, // manipulado: real es 1000
      forma_pago: 'efectivo',
      productos: [{ producto_id: productoId, cantidad: 1, precio: 1000, unidad: 'KG' }]
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Total manipulado|discrepancia/i);
  });

  it('detalles devuelven subtotales numéricos', async () => {
    const auth = await loginAsAdmin();

    const cliRes = await withAuth(request(app).post('/api/clientes'), auth).send({ nombre: 'Cliente Factura Test 3' });
    const clienteId = cliRes.body.id;

    const prodRes = await withAuth(request(app).post('/api/productos'), auth).send({
      codigo: 'TEST-003',
      nombre: 'Producto Test 3',
      precio_kg: 2000
    });
    const productoId = prodRes.body.id;

    const facturaRes = await withAuth(request(app).post('/api/facturas'), auth).send({
      cliente_id: clienteId,
      productos: [{ producto_id: productoId, cantidad: 2, precio: 2000, unidad: 'KG' }]
    });
    expect(facturaRes.status).toBe(201);
    const facturaId = facturaRes.body.id;

    const res = await withAuth(request(app).get(`/api/facturas/${facturaId}/detalles`), auth);
    expect(res.status).toBe(200);
    // TS servicio devuelve productos con subtotal numérico
    const productos = res.body.productos || res.body.detalles || [];
    const first = Array.isArray(productos) ? productos[0] : null;
    expect(first).toBeDefined();
    expect(Number(first.subtotal)).toBeCloseTo(4000, 2);
  });

  it('rechaza crear factura sin auth → 401', async () => {
    const res = await request(app).post('/api/facturas').send({
      cliente_id: 1,
      productos: [{ producto_id: 1, cantidad: 1, precio: 1000, unidad: 'KG' }]
    });
    expect(res.status).toBe(401);
  });
});
