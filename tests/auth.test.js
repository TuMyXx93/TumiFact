const request = require('supertest');
const { truncateAll } = require('./helpers');
const app = require('../app');

describe('Auth & RBAC Module (Argon2id + JWT + Dual Login)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('permite login con email y password válidos', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        credential: 'admin@tumifact.com',
        password: 'Password*2026'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body.user).toHaveProperty('email', 'admin@tumifact.com');
  });

  it('permite login con número de identificación (cédula)', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        credential: '10000001',
        password: 'Password*2026'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body.user).toHaveProperty('numero_identificacion', '10000001');
  });

  it('rechaza login con credenciales incorrectas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        credential: 'usuario_inexistente@tumifact.com',
        password: 'WrongPassword!'
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
