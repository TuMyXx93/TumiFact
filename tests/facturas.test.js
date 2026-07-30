const request = require('supertest');
const { truncateAll } = require('./helpers');
const app = require('../app');

describe('Facturas', () => {
    beforeEach(async () => {
        await truncateAll();
    });

    it('crea una factura y devuelve 201 con total recalculado', async () => {
        const cliente = await request(app)
            .post('/api/clientes')
            .send({ nombre: 'Cliente Factura Test' });

        const producto = await request(app)
            .post('/api/productos')
            .send({
                codigo: 'TEST-001',
                nombre: 'Producto Test',
                precio_kg: 15000
            });

        const res = await request(app)
            .post('/api/facturas')
            .send({
                cliente_id: cliente.body.id,
                total: 75000,
                forma_pago: 'efectivo',
                productos: [
                    {
                        producto_id: producto.body.id,
                        cantidad: 5,
                        precio: 15000,
                        unidad: 'KG'
                    }
                ]
            });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
    });

    it('rechaza total manipulado con 400', async () => {
        const cliente = await request(app)
            .post('/api/clientes')
            .send({ nombre: 'Cliente Factura Test 2' });

        const producto = await request(app)
            .post('/api/productos')
            .send({
                codigo: 'TEST-002',
                nombre: 'Producto Test 2',
                precio_kg: 1000
            });

        const res = await request(app)
            .post('/api/facturas')
            .send({
                cliente_id: cliente.body.id,
                total: 99999,
                forma_pago: 'efectivo',
                productos: [
                    {
                        producto_id: producto.body.id,
                        cantidad: 1,
                        precio: 1000,
                        unidad: 'KG'
                    }
                ]
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Total manipulado/);
    });

    it('detalles devuelven subtotales numéricos', async () => {
        const cliente = await request(app)
            .post('/api/clientes')
            .send({ nombre: 'Cliente Factura Test 3' });

        const producto = await request(app)
            .post('/api/productos')
            .send({
                codigo: 'TEST-003',
                nombre: 'Producto Test 3',
                precio_kg: 2000
            });

        const factura = await request(app)
            .post('/api/facturas')
            .send({
                cliente_id: cliente.body.id,
                productos: [
                    {
                        producto_id: producto.body.id,
                        cantidad: 2,
                        precio: 2000,
                        unidad: 'KG'
                    }
                ]
            });

        const res = await request(app).get(`/api/facturas/${factura.body.id}/detalles`);
        expect(res.status).toBe(200);
        expect(res.body.productos[0].subtotal).toBeCloseTo(4000, 2);
    });
});
