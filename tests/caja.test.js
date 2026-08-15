const request = require('supertest');
const { truncateAll } = require('./helpers');
const app = require('../app');
const db = require('../db');

describe('Caja (Sesiones de Caja) Module', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('permite abrir caja, consultar estado y cerrarla con arqueo', async () => {
    // 1. Abrir caja
    const openRes = await request(app)
      .post('/api/caja/abrir')
      .send({
        monto_apertura: 100000,
        notas: 'Apertura de turno mañana'
      });

    expect(openRes.status).toBe(201);
    expect(openRes.body.sesion).toBeDefined();
    expect(openRes.body.sesion.estado).toBe('abierta');

    // 2. Consultar estado
    const statusRes = await request(app).get('/api/caja/estado');
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.abierta).toBe(true);

    // 3. Cerrar caja
    const closeRes = await request(app)
      .post('/api/caja/cerrar')
      .send({
        monto_cierre_declarado: 100000,
        notas: 'Cierre de turno normal'
      });

    expect(closeRes.status).toBe(200);
    expect(closeRes.body.reporte.estado).toBe('cerrada');
  });
});
