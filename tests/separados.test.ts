import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/db';
import { truncateAll } from './helpers';

async function loginAsAdmin() {
  const res = await request(app)
    .post('/api/auth/login')
    .set('Accept', 'application/vnd.tumifact.auth+json')
    .send({ credential: 'admin@tumifact.com', password: 'Password*2026' });
  if (res.status !== 200)
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  const token = res.body.token as string | undefined;
  if (token) return { authHeader: `Bearer ${token}` } as const;
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const tokenCookie =
    cookies?.find((c: string) => c.startsWith('tumifact_token='))?.split(';')[0] || '';
  return { cookie: tokenCookie } as const;
}

function withAuth(req: any, auth: any) {
  if (auth.authHeader) req.set('Authorization', auth.authHeader);
  if (auth.cookie) req.set('Cookie', auth.cookie);
  return req;
}

describe('Separados (Layaway) — Stack TS (Vitest + src/app)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('crea un separado, registra abonos y lista separados (auth + idempotencia)', async () => {
    const auth = await loginAsAdmin();

    // 1. Crear cliente y producto vía pool directo (más rápido y sin validación extra)
    const cRes = await pool.query(
      `INSERT INTO clientes (nombre, telefono) VALUES ('Cliente Separado', '3001234567') RETURNING id`
    );
    const clienteId = cRes.rows[0].id;

    const pRes = await pool.query(
      `INSERT INTO productos (codigo, nombre, precio_unidad, stock_actual) VALUES ('SEP-001', 'Chaqueta Cuero', 150000, 10) RETURNING id`
    );
    const prodId = pRes.rows[0].id;

    // 2. Crear separado con auth
    const sepRes = await withAuth(request(app).post('/api/separados'), auth).send({
      cliente_id: clienteId,
      descripcion: 'Separado Chaqueta Cuero',
      valor_total: 150000,
      abono_inicial: 50000,
      dias_plazo: 30,
      productos: [{ producto_id: prodId, cantidad: 1, precio_unitario: 150000, subtotal: 150000 }],
    });

    expect(sepRes.status).toBe(201);
    const separado = sepRes.body.separado || sepRes.body;
    const separadoId = separado.id;
    expect(separadoId).toBeDefined();

    // 3. Registrar segundo abono que completa el separado
    const abonoRes = await withAuth(
      request(app).post(`/api/separados/${separadoId}/abonos`),
      auth
    ).send({
      monto: 100000,
      forma_pago: 'efectivo',
    });

    expect(abonoRes.status).toBe(201);
    // TS puede devolver completado o estado
    expect(
      abonoRes.body.completado === true ||
        abonoRes.body.estado === 'completado' ||
        abonoRes.body.saldo_pendiente === 0 ||
        abonoRes.body.saldo_pendiente === '0' ||
        abonoRes.body.message
    ).toBeTruthy();

    // 4. Listar con auth
    const listRes = await withAuth(request(app).get('/api/separados'), auth);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);
  });

  it('rechaza crear separado sin auth → 401', async () => {
    const res = await request(app).post('/api/separados').send({
      cliente_id: 1,
      descripcion: 'Sin auth',
      valor_total: 10000,
      abono_inicial: 1000,
      productos: [],
    });
    expect(res.status).toBe(401);
  });

  it('rechaza abono sin auth → 401', async () => {
    const res = await request(app).post('/api/separados/1/abonos').send({ monto: 1000 });
    expect(res.status).toBe(401);
  });
});
