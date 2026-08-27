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

describe('Reportes — Stack TS (Vitest + src/app)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('exporta reporte de ventas en CSV (requiere auth gerente/admin)', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).get('/api/reportes/ventas?format=csv'), auth);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  it('exporta inventario en CSV (requiere auth)', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).get('/api/reportes/inventario'), auth);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });

  it('exporta reporte de ventas en PDF (requiere auth)', async () => {
    const auth = await loginAsAdmin();
    const res = await withAuth(request(app).get('/api/reportes/ventas?format=pdf'), auth);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('rechaza reportes sin auth → 401', async () => {
    const res = await request(app).get('/api/reportes/ventas?format=csv');
    expect(res.status).toBe(401);
  });

  it('rechaza reportes con empleado (cajero) → 403 (solo gerente/admin)', async () => {
    // Crear cajero directamente en DB con id explícito para evitar colisión de secuencia (RESTART IDENTITY deja seq en 1)
    const { pool } = await import('../src/db');
    const argon2 = await import('argon2');
    const cajeroEmail = `cajero_${Date.now()}@test.com`;
    const hash = await argon2.hash('Password*2026');
    // Usar id 999 para no colisionar con admin id=1 y secuencia
    await pool.query(
      `INSERT INTO usuarios (id, nombre, apellido, email, password_hash, rol_id, activo) VALUES (999, 'Cajero','Test',$1,$2,3,true) ON CONFLICT (id) DO NOTHING`,
      [cajeroEmail, hash]
    );
    await pool.query(`SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios))`);

    const cajeroLogin = await request(app)
      .post('/api/auth/login')
      .set('Accept', 'application/vnd.tumifact.auth+json')
      .send({ credential: cajeroEmail, password: 'Password*2026' });
    expect(cajeroLogin.status).toBe(200);
    const cajeroToken = cajeroLogin.body.token as string | undefined;
    const cajeroAuth = cajeroToken
      ? ({ authHeader: `Bearer ${cajeroToken}` } as const)
      : ({
          cookie:
            (cajeroLogin.headers['set-cookie'] as unknown as string[])
              .find((c: string) => c.startsWith('tumifact_token='))
              ?.split(';')[0] || '',
        } as const);

    const res = await withAuth(request(app).get('/api/reportes/ventas?format=csv'), cajeroAuth);
    expect(res.status).toBe(403);
  });
});
