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

describe('Empleados — Stack TS (Vitest + src/app)', () => {
  beforeEach(async () => {
    await truncateAll();
    // Seed empleado perfil para admin id=1
    await pool.query(
      `INSERT INTO empleados (usuario_id, cargo, departamento, salario) VALUES (1, 'Director', 'Admin', 5000000) ON CONFLICT DO NOTHING`
    );
  });

  it('lista empleados con admin → 200', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).get('/api/empleados'), auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('rechaza lista sin auth → 401', async () => {
    const res = await request(app).get('/api/empleados');
    expect(res.status).toBe(401);
  });

  it('crea empleado con admin → 201', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).post('/api/empleados'), auth).send({
      nombre: 'Nuevo',
      apellido: 'Empleado',
      numero_identificacion: `EMP${Date.now()}`,
      email: `emp${Date.now()}@test.com`,
      password: 'Password*2026',
      rol_id: 3,
      cargo: 'Cajero',
    });
    expect(res.status).toBe(201);
    expect(res.body.empleado).toBeDefined();
  });

  it('actualiza empleado con admin → 200', async () => {
    const auth = await loginAsAdmin();
    // admin usuario_id=1 → empleado id=1
    const res = await withAuth(request(app).put('/api/empleados/1'), auth).send({
      cargo: 'Director General',
    });
    expect(res.status).toBe(200);
    expect(res.body.empleado.cargo).toBe('Director General');
  });

  it('toggle-status empleado con admin → 200', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).patch('/api/empleados/1/toggle-status'), auth);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/activado|desactivado/);
  });

  it('detalle de empleado inexistente → 404', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).get('/api/empleados/9999'), auth);
    expect(res.status).toBe(404);
  });
});
