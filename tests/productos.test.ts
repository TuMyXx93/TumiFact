import request from 'supertest';
import app from '../src/app';
import { truncateAll } from './helpers';
import { pool } from '../src/db';

async function loginAsAdmin() {
  const res = await request(app)
    .post('/api/auth/login')
    .set('Accept', 'application/vnd.tumifact.auth+json')
    .send({ credential: 'admin@tumifact.com', password: 'Password*2026' });
  if (res.status !== 200) throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  const token = res.body.token as string | undefined;
  if (token) return { authHeader: `Bearer ${token}` };
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const tokenCookie = cookies?.find((c: string) => c.startsWith('tumifact_token='))?.split(';')[0] || '';
  return { authHeader: '', cookie: tokenCookie };
}

describe('Productos — Stack TS (Vitest + src/app)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    // No cerrar pool aquí — lo hace el global teardown
  });

  it('crea un producto de Ropa y devuelve 201 (requiere auth gerente/admin)', async () => {
    const { authHeader, cookie } = await loginAsAdmin();
    const agent = request(app).post('/api/productos');
    if (authHeader) agent.set('Authorization', authHeader);
    if (cookie) agent.set('Cookie', cookie);

    const res = await agent.send({
      codigo: 'ROPA-001',
      nombre: 'Camiseta Polo Piqué Algodón',
      precio_detal: 45000,
      precio_mayorista: 35000,
      cantidad_mayorista: 12,
      atributos: { talla: 'L', color: 'Azul', genero: 'Hombre' },
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.codigo).toBe('ROPA-001');
    expect(Number(res.body.precio_detal)).toBe(45000);
  });

  it('crea un producto de Artículos (nueva familia) y devuelve 201', async () => {
    const { authHeader, cookie } = await loginAsAdmin();
    const agent = request(app).post('/api/productos');
    if (authHeader) agent.set('Authorization', authHeader);
    if (cookie) agent.set('Cookie', cookie);

    const res = await agent.send({
      codigo: 'ART-001',
      nombre: 'Termo Acero Inoxidable 750ml',
      precio_detal: 38000,
      precio_mayorista: 26000,
      cantidad_mayorista: 10,
      atributos: { marca: 'HydroCold', referencia: 'HC-750-SS', presentacion: 'Caja' },
    });

    expect(res.status).toBe(201);
    expect(res.body.codigo).toBe('ART-001');
  });

  it('rechaza codigo duplicado con 409', async () => {
    const { authHeader, cookie } = await loginAsAdmin();
    const makeReq = () => {
      const r = request(app).post('/api/productos');
      if (authHeader) r.set('Authorization', authHeader);
      if (cookie) r.set('Cookie', cookie);
      return r;
    };

    await makeReq().send({ codigo: 'ROPA-001', nombre: 'Camiseta Polo' });
    const res = await makeReq().send({ codigo: 'ROPA-001', nombre: 'Camiseta Polo' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/código|existe/i);
  });

  it('rechaza campos requeridos con 400 (Zod)', async () => {
    const { authHeader, cookie } = await loginAsAdmin();
    const r = request(app).post('/api/productos');
    if (authHeader) r.set('Authorization', authHeader);
    if (cookie) r.set('Cookie', cookie);
    const res = await r.send({ codigo: 'ROPA-002' }); // sin nombre
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toHaveProperty('nombre');
  });

  it('lista productos (GET requiere auth)', async () => {
    const { authHeader, cookie } = await loginAsAdmin();
    const makeAuth = (req: any) => {
      if (authHeader) req.set('Authorization', authHeader);
      if (cookie) req.set('Cookie', cookie);
      return req;
    };

    await makeAuth(request(app).post('/api/productos')).send({
      codigo: 'TEC-001',
      nombre: 'Audífonos Bluetooth AU-88',
      precio_detal: 189000,
    });

    const res = await makeAuth(request(app).get('/api/productos'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(JSON.stringify(res.body)).toMatch(/Audífonos Bluetooth AU-88/);
  });

  it('rechaza crear producto sin auth → 401', async () => {
    const res = await request(app).post('/api/productos').send({ codigo: 'X-001', nombre: 'Sin Auth' });
    expect(res.status).toBe(401);
  });

  it('permite crear producto sin proveedor y luego asociarle un proveedor mediante edición', async () => {
    const { authHeader, cookie } = await loginAsAdmin();
    const makeAuth = (req: any) => {
      if (authHeader) req.set('Authorization', authHeader);
      if (cookie) req.set('Cookie', cookie);
      return req;
    };

    // 1. Crear un proveedor de prueba
    const provRes = await pool.query(`
      INSERT INTO proveedores (nombre, razon_social, numero_identificacion, email, activo)
      VALUES ('Distribuidora Tech SAS', 'Distribuidora Tech SAS', '900123456-1', 'ventas@techsas.com', true)
      RETURNING id, nombre
    `);
    const provId = provRes.rows[0].id;
    expect(provId).toBeDefined();

    // 2. Crear producto SIN proveedor (debe quedar null por defecto)
    const prodRes = await makeAuth(request(app).post('/api/productos')).send({
      codigo: 'TEC-TEST-001',
      nombre: 'Mouse Gamer RGB',
      precio_detal: 75000,
    });
    expect(prodRes.status).toBe(201);
    expect(prodRes.body.proveedor_id).toBeNull();

    // 3. Asociar proveedor mediante PUT (edición posterior)
    const updateRes = await makeAuth(request(app).put(`/api/productos/${prodRes.body.id}`)).send({
      proveedor_id: provId,
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.proveedor_id).toBe(provId);

    // 4. Verificar en GET /api/productos que retorne el proveedor_nombre
    const listRes = await makeAuth(request(app).get('/api/productos'));
    expect(listRes.status).toBe(200);
    const item = listRes.body.find((p: any) => p.id === prodRes.body.id);
    expect(item).toBeDefined();
    expect(item.proveedor_id).toBe(provId);
    expect(item.proveedor_nombre).toBe('Distribuidora Tech SAS');

    // 5. Desasociar proveedor (ponerlo en null)
    const clearRes = await makeAuth(request(app).put(`/api/productos/${prodRes.body.id}`)).send({
      proveedor_id: null,
    });
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.proveedor_id).toBeNull();
  });
});
