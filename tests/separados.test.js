const request = require('supertest');
const { truncateAll } = require('./helpers');
const app = require('../app');
const db = require('../db');

describe('Separados (Layaway System) Module', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('crea un separado, registra abonos y lista separados', async () => {
    // 1. Crear cliente y producto
    const cRes = await db.query(
      `INSERT INTO clientes (nombre, direccion, telefono) VALUES ('Cliente Separado', 'Calle 10 #20', '3001234567') RETURNING id`
    );
    const clienteId = cRes.rows[0].id;

    const pRes = await db.query(
      `INSERT INTO productos (codigo, nombre, precio_unidad, stock_actual) VALUES ('SEP-001', 'Chaqueta Cuero', 150000, 10) RETURNING id`
    );
    const prodId = pRes.rows[0].id;

    // 2. Crear separado
    const sepRes = await request(app)
      .post('/api/separados')
      .send({
        cliente_id: clienteId,
        descripcion: 'Separado Chaqueta Cuero',
        valor_total: 150000,
        abono_inicial: 50000,
        dias_plazo: 30,
        productos: [
          { producto_id: prodId, cantidad: 1, precio_unitario: 150000, subtotal: 150000 }
        ]
      });

    expect(sepRes.status).toBe(201);
    const separadoId = sepRes.body.separado.id;
    expect(separadoId).toBeDefined();

    // 3. Registrar segundo abono que completa el separado
    const abonoRes = await request(app)
      .post(`/api/separados/${separadoId}/abonos`)
      .send({
        monto: 100000,
        forma_pago: 'efectivo'
      });

    expect(abonoRes.status).toBe(201);
    expect(abonoRes.body.completado).toBe(true);

    // 4. Listar
    const listRes = await request(app).get('/api/separados');
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBeGreaterThan(0);
  });
});
