const request = require('supertest');
const { truncateAll } = require('./helpers');
const app = require('../app');
const db = require('../db');

describe('Reportes Module (PDF / CSV Exports)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('exporta reporte de ventas en CSV', async () => {
    const res = await request(app).get('/api/reportes/ventas?format=csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });

  it('exporta inventario en CSV', async () => {
    const res = await request(app).get('/api/reportes/inventario');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });

  it('exporta reporte de ventas en PDF', async () => {
    const res = await request(app).get('/api/reportes/ventas?format=pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });
});
