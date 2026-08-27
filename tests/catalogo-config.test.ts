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

describe('Configuracion / Descuentos / Categorias / Proveedores — Stack TS', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  // ===== CONFIGURACION =====
  it('GET /api/configuracion devuelve config por defecto → 200', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).get('/api/configuracion'), auth);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('POST /api/configuracion guarda con admin → 200', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).post('/api/configuracion'), auth).send({
      nombre_negocio: 'TumiFact Test Store',
      direccion: 'Calle 123',
      telefono: '3001112233',
      nit: '900.123.456-7',
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/exitosamente/i);
  });

  it('POST /api/configuracion rechaza sin nombre_negocio → 400 (Zod)', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).post('/api/configuracion'), auth).send({
      telefono: '3001112233',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  // ===== DESCUENTOS =====
  it('crea descuento con admin → 201', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).post('/api/descuentos'), auth).send({
      nombre: 'Descuento Black Friday',
      tipo: 'porcentaje',
      valor: 15,
      aplica_a: 'total',
    });
    expect([200, 201]).toContain(res.status);
  });

  it('lista descuentos con admin → 200', async () => {
    const auth = await loginAsAdmin();
    await withAuth(request(app).post('/api/descuentos'), auth).send({
      nombre: 'Desc Test',
      tipo: 'monto_fijo',
      valor: 5000,
    });
    const res = await withAuth(request(app).get('/api/descuentos'), auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('rechaza descuento sin auth → 401', async () => {
    const res = await request(app)
      .post('/api/descuentos')
      .send({ nombre: 'X', tipo: 'porcentaje', valor: 10 });
    expect(res.status).toBe(401);
  });

  // ===== CATEGORIAS =====
  it('crea categoria con admin → 201', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).post('/api/categorias'), auth).send({
      nombre: `Categoria_${Date.now()}`,
      tipo: 'tecnologia',
      descripcion: 'Dispositivos electrónicos',
    });
    expect([200, 201]).toContain(res.status);
  });

  it('lista categorias con admin → 200', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).get('/api/categorias'), auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ===== PROVEEDORES =====
  it('crea proveedor con admin → 201', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).post('/api/proveedores'), auth).send({
      nombre: `Proveedor_${Date.now()}`,
      numero_identificacion: '900555444-1',
      contacto_nombre: 'Juan Pérez',
      telefono: '3009998877',
    });
    expect([200, 201]).toContain(res.status);
  });

  it('lista proveedores con admin → 200', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).get('/api/proveedores'), auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
