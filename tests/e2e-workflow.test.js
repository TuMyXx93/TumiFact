const request = require('supertest');
const { truncateAll } = require('./helpers');
const app = require('../app');
const db = require('../db');

describe('E2E Real-world Workflow: Auth -> Caja -> POS Facturacion -> Kardex -> Cierre Arqueo', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('ejecuta el ciclo de vida completo de un cajero/vendedor de forma integrada', async () => {
    // 1. Crear producto base para la prueba
    const prodRes = await request(app)
      .post('/api/productos')
      .send({
        codigo: 'PROD-E2E-001',
        nombre: 'Manzanas Royal Gala',
        precio_kg: 8000,
        precio_unidad: 1500,
        precio_libra: 4000,
        stock_actual: 50,
        stock_minimo: 5
      });
    expect(prodRes.status).toBe(201);
    const productoId = prodRes.body.id;

    // 2. Crear cliente base
    const cliRes = await request(app)
      .post('/api/clientes')
      .send({
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        telefono: '3009876543',
        numero_identificacion: '1098765432'
      });
    expect(cliRes.status).toBe(201);
    const clienteId = cliRes.body.id;

    // 3. Flujo Auth: Login de Usuario Dual
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        credential: 'admin@tumifact.com',
        password: 'Password*2026'
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    const token = loginRes.body.token;

    // 4. Apertura de Caja con Token
    const abrirCajaRes = await request(app)
      .post('/api/caja/abrir')
      .set('Authorization', `Bearer ${token}`)
      .send({
        monto_apertura: 50000,
        notas: 'Turno matutino inicio con base de 50.000'
      });
    expect(abrirCajaRes.status).toBe(201);
    expect(abrirCajaRes.body.sesion).toBeDefined();
    const sesionCajaId = abrirCajaRes.body.sesion.id;

    // 5. Consultar estado activo de caja
    const estadoCajaRes = await request(app)
      .get('/api/caja/estado')
      .set('Authorization', `Bearer ${token}`);
    expect(estadoCajaRes.status).toBe(200);
    expect(estadoCajaRes.body.abierta).toBe(true);

    // 6. Venta POS / Facturación vinculada a la sesión de caja
    const ventaRes = await request(app)
      .post('/api/facturas')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d')
      .send({
        cliente_id: clienteId,
        sesion_caja_id: sesionCajaId,
        total: 16000,
        forma_pago: 'efectivo',
        productos: [
          {
            producto_id: productoId,
            cantidad: 2,
            precio: 8000,
            unidad: 'KG'
          }
        ]
      });
    expect(ventaRes.status).toBe(201);
    expect(ventaRes.body.id).toBeDefined();

    // 7. Verificar que el estado de caja refleja la venta en efectivo en tiempo real
    const estadoPostVenta = await request(app)
      .get('/api/caja/estado')
      .set('Authorization', `Bearer ${token}`);
    expect(estadoPostVenta.status).toBe(200);
    expect(estadoPostVenta.body.sesion).toBeDefined();
    expect(Number(estadoPostVenta.body.sesion.ventas_efectivo)).toBe(16000);
    expect(Number(estadoPostVenta.body.sesion.total_ventas)).toBe(16000);

    // 8. Cierre de Caja con Arqueo (Base 50.000 + Venta 16.000 = Esperado 66.000)
    const cierreRes = await request(app)
      .post('/api/caja/cerrar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        monto_cierre_declarado: 66000,
        notas: 'Cierre cuadrado perfecto'
      });
    expect(cierreRes.status).toBe(200);
    expect(cierreRes.body.reporte.estado).toBe('cerrada');
    expect(Number(cierreRes.body.reporte.diferencia_caja)).toBe(0);
  });
});
