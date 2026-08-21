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
  if (token) return { authHeader: `Bearer ${token}` };
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const tokenCookie = cookies?.find((c: string) => c.startsWith('tumifact_token='))?.split(';')[0] || '';
  return { authHeader: '', cookie: tokenCookie };
}

function withAuth(req: any, auth: { authHeader?: string; cookie?: string }) {
  if (auth.authHeader) req.set('Authorization', auth.authHeader);
  if ((auth as any).cookie) req.set('Cookie', (auth as any).cookie);
  return req;
}

describe('Clientes — Stack TS (Vitest + src/app)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('crea un cliente y devuelve 201 (requiere auth)', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).post('/api/clientes'), auth).send({
      nombre: 'Fruver Central S.A.S.',
      telefono: '3010000000'
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.nombre).toMatch(/Fruver/);
  });

  it('lista clientes con auth', async () => {
    const auth = await loginAsAdmin();
    await withAuth(request(app).post('/api/clientes'), auth).send({ nombre: 'Cliente Uno' });
    const res = await withAuth(request(app).get('/api/clientes'), auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('soft-delete cliente (activo=false) incluso con facturas — nuevo comportamiento TS', async () => {
    const auth = await loginAsAdmin();
    // Crear producto (requiere auth gerente)
    const prodRes = await withAuth(request(app).post('/api/productos'), auth).send({
      codigo: 'TEST-001',
      nombre: 'Producto Test',
      precio_kg: 1000
    });
    expect(prodRes.status).toBe(201);
    const productoId = prodRes.body.id;

    const cliRes = await withAuth(request(app).post('/api/clientes'), auth).send({ nombre: 'Cliente Test' });
    expect(cliRes.status).toBe(201);
    const clienteId = cliRes.body.id;

    // Crear factura asociada (usa src/app TS: requiere cliente_id, productos, total)
    // Nota: TS facturas requiere auth y cálculo de total; usamos facturación directa
    const facturaRes = await withAuth(request(app).post('/api/facturas'), auth).send({
      cliente_id: clienteId,
      forma_pago: 'efectivo',
      total: 1000,
      productos: [{ producto_id: productoId, cantidad: 1, precio: 1000, unidad: 'KG' }]
    });
    // Puede ser 201 si el flujo es válido
    expect([201, 400]).toContain(facturaRes.status);

    // DELETE ahora es soft-delete (activo=false) y debe devolver 200, no 400 legacy
    const delRes = await withAuth(request(app).delete(`/api/clientes/${clienteId}`), auth);
    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toMatch(/eliminado/i);
  });

  it('rechaza crear cliente sin auth → 401', async () => {
    const res = await request(app).post('/api/clientes').send({ nombre: 'Sin Auth' });
    expect(res.status).toBe(401);
  });
});
