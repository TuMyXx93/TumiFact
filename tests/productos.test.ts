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
  // Prefer Bearer token if provided, else extract cookie
  const token = res.body.token as string | undefined;
  if (token) return { authHeader: `Bearer ${token}` };
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const tokenCookie = cookies?.find((c: string) => c.startsWith('tumifact_token='))?.split(';')[0] || '';
  return { authHeader: '', cookie: tokenCookie };
}

describe('Productos — Stack TS (Vitest + src/app)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    // No cerrar pool aquí — lo hace el global teardown; solo para vitest --run
  });

  it('crea un producto y devuelve 201 (requiere auth gerente/admin)', async () => {
    const { authHeader, cookie } = await loginAsAdmin();
    const agent = request(app).post('/api/productos');
    if (authHeader) agent.set('Authorization', authHeader);
    if (cookie) agent.set('Cookie', cookie);

    const res = await agent.send({
      codigo: 'FRESA-001',
      nombre: 'Fresas Premium',
      precio_kg: 15000,
      precio_unidad: 5000,
      precio_libra: 6800
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.codigo).toBe('FRESA-001');
  });

  it('rechaza codigo duplicado con 409', async () => {
    const { authHeader, cookie } = await loginAsAdmin();
    const makeReq = () => {
      const r = request(app).post('/api/productos');
      if (authHeader) r.set('Authorization', authHeader);
      if (cookie) r.set('Cookie', cookie);
      return r;
    };

    await makeReq().send({ codigo: 'FRESA-001', nombre: 'Fresas Premium' });
    const res = await makeReq().send({ codigo: 'FRESA-001', nombre: 'Fresas Premium' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/código|existe/i);
  });

  it('rechaza campos requeridos con 400 (Zod)', async () => {
    const { authHeader, cookie } = await loginAsAdmin();
    const r = request(app).post('/api/productos');
    if (authHeader) r.set('Authorization', authHeader);
    if (cookie) r.set('Cookie', cookie);
    const res = await r.send({ codigo: 'FRESA-002' }); // sin nombre
    expect(res.status).toBe(400);
    // Zod details: { nombre: "..."}
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toHaveProperty('nombre');
  });

  it('lista productos (GET requiere auth)', async () => {
    const { authHeader, cookie } = await loginAsAdmin();
    const makeAuth = (req: any) => {
      if (authHeader) req.set('Authorization', authHeader);
      if (cookie) req.set('Cookie', cookie);
      return req;
    };

    await makeAuth(request(app).post('/api/productos')).send({ codigo: 'FRESA-001', nombre: 'Fresas Premium' });

    const res = await makeAuth(request(app).get('/api/productos'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(JSON.stringify(res.body)).toMatch(/Fresas Premium/);
  });

  it('rechaza crear producto sin auth → 401', async () => {
    const res = await request(app).post('/api/productos').send({ codigo: 'X-001', nombre: 'Sin Auth' });
    expect(res.status).toBe(401);
  });
});
