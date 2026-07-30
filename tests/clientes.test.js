const request = require('supertest');
const { truncateAll } = require('./helpers');
const app = require('../app');

describe('Clientes', () => {
    beforeEach(async () => {
        await truncateAll();
    });

    it('crea un cliente y devuelve 201', async () => {
        const res = await request(app)
            .post('/api/clientes')
            .send({
                nombre: 'Fruver Central S.A.S.',
                direccion: 'Calle 1',
                telefono: '3010000000'
            });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
    });

    it('rechaza eliminar cliente con facturas asociadas', async () => {
        const producto = await request(app)
            .post('/api/productos')
            .send({
                codigo: 'TEST-001',
                nombre: 'Producto Test',
                precio_kg: 1000
            });

        const cliente = await request(app)
            .post('/api/clientes')
            .send({ nombre: 'Cliente Test' });

        const clienteId = cliente.body.id;
        const productoId = producto.body.id;

        await request(app)
            .post('/api/facturas')
            .send({
                cliente_id: clienteId,
                forma_pago: 'efectivo',
                productos: [
                    {
                        producto_id: productoId,
                        cantidad: 1,
                        precio: 1000,
                        unidad: 'KG'
                    }
                ]
            });

        const res = await request(app).delete(`/api/clientes/${clienteId}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/facturas/);
    });
});
