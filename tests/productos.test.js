const request = require('supertest');
const { truncateAll } = require('./helpers');
const app = require('../app');

describe('Productos', () => {
    beforeEach(async () => {
        await truncateAll();
    });

    it('crea un producto y devuelve 201', async () => {
        const res = await request(app)
            .post('/api/productos')
            .send({
                codigo: 'FRESA-001',
                nombre: 'Fresas Premium',
                precio_kg: 15000,
                precio_unidad: 5000,
                precio_libra: 6800
            });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.message).toMatch(/exitosamente/);
    });

    it('rechaza codigo duplicado con 400', async () => {
        await request(app)
            .post('/api/productos')
            .send({
                codigo: 'FRESA-001',
                nombre: 'Fresas Premium'
            });

        const res = await request(app)
            .post('/api/productos')
            .send({
                codigo: 'FRESA-001',
                nombre: 'Fresas Premium'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/código/);
    });

    it('rechaza campos requeridos con 400', async () => {
        const res = await request(app)
            .post('/api/productos')
            .set('Accept', 'application/json')
            .send({
                codigo: 'FRESA-002'
            });

        expect(res.status).toBe(400);
        expect(res.body.details.nombre).toBeDefined();
    });

    it('lista productos', async () => {
        await request(app)
            .post('/api/productos')
            .send({
                codigo: 'FRESA-001',
                nombre: 'Fresas Premium'
            });

        const res = await request(app).get('/api/productos');
        expect(res.status).toBe(200);
        expect(res.text).toMatch(/Fresas Premium/);
    });
});
