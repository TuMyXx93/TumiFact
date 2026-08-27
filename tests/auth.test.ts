import request from 'supertest';
import app from '../src/app';
import { truncateAll } from './helpers';

describe('Auth & RBAC — Stack TS (Vitest + src/app)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('permite login con email y password válidos', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Accept', 'application/vnd.tumifact.auth+json')
      .send({ credential: 'admin@tumifact.com', password: 'Password*2026' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'admin@tumifact.com');
    expect(res.body.user.rol_nombre).toBe('admin');
  });

  it('permite login con número de identificación (cédula)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Accept', 'application/vnd.tumifact.auth+json')
      .send({ credential: '10000001', password: 'Password*2026' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('numero_identificacion', '10000001');
  });

  it('rechaza login con credenciales incorrectas → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ credential: 'usuario_inexistente@tumifact.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('rechaza acceso sin auth a rutas protegidas → 401', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/No autorizado|Token/i);
  });

  it('rechaza token inválido → 401', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  it('login setea cookies HttpOnly tumifact_token y tumifact_refresh', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ credential: 'admin@tumifact.com', password: 'Password*2026' });

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.join(';')).toContain('tumifact_token=');
    expect(cookies.join(';')).toContain('tumifact_refresh=');
    // HttpOnly check
    expect(cookies.find((c) => c.startsWith('tumifact_token='))).toMatch(/HttpOnly/i);
  });
});
