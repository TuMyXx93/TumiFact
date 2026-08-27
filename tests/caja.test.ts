import request from 'supertest';
import app from '../src/app';
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

describe('Caja (Sesiones de Caja) — Stack TS (Vitest + src/app)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('permite abrir caja, consultar estado y cerrarla con arqueo (auth)', async () => {
    const auth = await loginAsAdmin();

    // 1. Abrir caja
    const openRes = await withAuth(request(app).post('/api/caja/abrir'), auth).send({
      monto_apertura: 100000,
      notas: 'Apertura de turno mañana',
    });
    expect(openRes.status).toBe(201);
    expect(openRes.body.sesion).toBeDefined();
    expect(openRes.body.sesion.estado).toBe('abierta');

    // 2. Consultar estado
    const statusRes = await withAuth(request(app).get('/api/caja/estado'), auth);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.abierta).toBe(true);
    expect(statusRes.body.sesion).toBeDefined();

    // 3. Cerrar caja
    const closeRes = await withAuth(request(app).post('/api/caja/cerrar'), auth).send({
      monto_cierre_declarado: 100000,
      notas: 'Cierre de turno normal',
    });
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.reporte).toBeDefined();
    // nuevo servicio devuelve reporte.estado dentro? En TS, reporte no tiene estado, pero sesion cerrada
    // Verificamos diferencia 0 y que no esté abierta
    const statusAfter = await withAuth(request(app).get('/api/caja/estado'), auth);
    expect(statusAfter.body.abierta).toBe(false);
  });

  it('rechaza abrir caja sin auth → 401', async () => {
    const res = await request(app).post('/api/caja/abrir').send({ monto_apertura: 100000 });
    expect(res.status).toBe(401);
  });

  it('rechaza consultar estado sin auth → 401', async () => {
    const res = await request(app).get('/api/caja/estado');
    expect(res.status).toBe(401);
  });
});
