import request from 'supertest';
import app from '../src/app';
import { truncateAll } from './helpers';

async function loginAsAdmin() {
  const res = await request(app)
    .post('/api/auth/login')
    .set('Accept', 'application/vnd.tumifact.auth+json')
    .send({ credential: 'admin@tumifact.com', password: 'Password*2026' });
  if (res.status !== 200) throw new Error(`Login admin failed: ${res.status} ${JSON.stringify(res.body)}`);
  const token = res.body.token as string | undefined;
  if (token) return { authHeader: `Bearer ${token}` } as const;
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const tokenCookie = cookies?.find((c: string) => c.startsWith('tumifact_token='))?.split(';')[0] || '';
  return { cookie: tokenCookie } as const;
}

function withAuth(req: any, auth: any) {
  if (auth.authHeader) req.set('Authorization', auth.authHeader);
  if (auth.cookie) req.set('Cookie', auth.cookie);
  return req;
}

describe('E2E — Flujo completo POS (Vitest + src/app TS)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('ejecuta ciclo completo: producto → cliente → login → caja → factura → estado → cierre', async () => {
    const auth = await loginAsAdmin();

    // 1. Crear producto (requiere auth gerente/admin)
    const prodRes = await withAuth(request(app).post('/api/productos'), auth).send({
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
    expect(productoId).toBeDefined();

    // 2. Crear cliente (requiere auth)
    const cliRes = await withAuth(request(app).post('/api/clientes'), auth).send({
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      telefono: '3009876543'
    });
    expect(cliRes.status).toBe(201);
    const clienteId = cliRes.body.id;

    // 3. Apertura de caja con auth
    const abrirCajaRes = await withAuth(request(app).post('/api/caja/abrir'), auth).send({
      monto_apertura: 50000,
      notas: 'Turno matutino inicio con base de 50.000'
    });
    expect(abrirCajaRes.status).toBe(201);
    expect(abrirCajaRes.body.sesion).toBeDefined();
    const sesionCajaId = abrirCajaRes.body.sesion.id;

    // 4. Consultar estado activo de caja
    const estadoCajaRes = await withAuth(request(app).get('/api/caja/estado'), auth);
    expect(estadoCajaRes.status).toBe(200);
    expect(estadoCajaRes.body.abierta).toBe(true);

    // 5. Venta POS vinculada a sesión de caja
    const ventaRes = await withAuth(request(app).post('/api/facturas'), auth)
      .set('Idempotency-Key', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d')
      .send({
        cliente_id: clienteId,
        total: 16000,
        forma_pago: 'efectivo',
        productos: [{ producto_id: productoId, cantidad: 2, precio: 8000, unidad: 'KG' }]
      });
    expect(ventaRes.status).toBe(201);
    expect(ventaRes.body.id).toBeDefined();

    // 6. Estado de caja refleja venta en tiempo real
    const estadoPostVenta = await withAuth(request(app).get('/api/caja/estado'), auth);
    expect(estadoPostVenta.status).toBe(200);
    expect(estadoPostVenta.body.sesion).toBeDefined();
    // El servicio calcula ventas_efectivo como número o string, verificar ambos
    expect(Number(estadoPostVenta.body.sesion.ventas_efectivo)).toBe(16000);
    expect(Number(estadoPostVenta.body.sesion.total_ventas)).toBe(16000);

    // 7. Cierre de caja con arqueo (Base 50.000 + Venta 16.000 = 66.000)
    const cierreRes = await withAuth(request(app).post('/api/caja/cerrar'), auth).send({
      monto_cierre_declarado: 66000,
      notas: 'Cierre cuadrado perfecto'
    });
    expect(cierreRes.status).toBe(200);
    expect(cierreRes.body.reporte).toBeDefined();
    // Diferencia debe ser 0 (declarado 66k - calculado 66k)
    expect(Number(cierreRes.body.reporte.diferencia_caja)).toBe(0);

    // Verificar que caja queda cerrada
    const estadoFinal = await withAuth(request(app).get('/api/caja/estado'), auth);
    expect(estadoFinal.body.abierta).toBe(false);
  });
});
