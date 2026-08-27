import request from 'supertest';
import app from '../src/app';
import { truncateAll } from './helpers';

async function loginAs(roleEmail: string) {
  const res = await request(app)
    .post('/api/auth/login')
    .set('Accept', 'application/vnd.tumifact.auth+json')
    .send({ credential: roleEmail, password: 'Password*2026' });
  if (res.status !== 200)
    throw new Error(`Login failed for ${roleEmail}: ${res.status} ${JSON.stringify(res.body)}`);
  const token = res.body.token as string | undefined;
  if (token) return { authHeader: `Bearer ${token}` };
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const tokenCookie =
    cookies?.find((c: string) => c.startsWith('tumifact_token='))?.split(';')[0] || '';
  return { authHeader: '', cookie: tokenCookie };
}

function withAuth(req: any, auth: { authHeader?: string; cookie?: string }) {
  if (auth.authHeader) req.set('Authorization', auth.authHeader);
  if ((auth as any).cookie) req.set('Cookie', (auth as any).cookie);
  return req;
}

describe('Proveedores — Stack TS (Vitest + src/app)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('crea un proveedor con admin → 201', async () => {
    const adminAuth = await loginAs('admin@tumifact.com');
    const res = await withAuth(request(app).post('/api/proveedores'), adminAuth).send({
      nombre: 'Distribuciones Colombia S.A.S.',
      razon_social: 'Distribuciones Colombia S.A.S.',
      numero_identificacion: '900.555.444-1',
      contacto_nombre: 'Carlos Gómez',
      email: 'ventas@distribucionescol.com',
      telefono: '3101234567',
      plazo_pago_dias: 45,
      moneda: 'COP',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('proveedor');
    expect(res.body.proveedor.nombre).toBe('Distribuciones Colombia S.A.S.');
    expect(res.body.proveedor.plazo_pago_dias).toBe(45);
  });

  it('lista proveedores y permite búsqueda por término', async () => {
    const adminAuth = await loginAs('admin@tumifact.com');
    await withAuth(request(app).post('/api/proveedores'), adminAuth).send({
      nombre: 'Textiles del Valle S.A.',
      numero_identificacion: '800.111.222-3',
      contacto_nombre: 'Marta Pérez',
    });

    await withAuth(request(app).post('/api/proveedores'), adminAuth).send({
      nombre: 'Calzados Nacionales Ltda.',
      numero_identificacion: '890.333.444-5',
    });

    // Listar todos
    const listRes = await withAuth(request(app).get('/api/proveedores'), adminAuth);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(2);

    // Búsqueda
    const searchRes = await withAuth(request(app).get('/api/proveedores?q=Textiles'), adminAuth);
    expect(searchRes.status).toBe(200);
    expect(Array.isArray(searchRes.body)).toBe(true);
    expect(searchRes.body.some((p: any) => p.nombre.includes('Textiles'))).toBe(true);
  });

  it('actualiza un proveedor con gerente → 200', async () => {
    const adminAuth = await loginAs('admin@tumifact.com');
    const createRes = await withAuth(request(app).post('/api/proveedores'), adminAuth).send({
      nombre: 'Proveedor Inicial',
      telefono: '3000000000',
    });
    expect(createRes.status).toBe(201);
    const id = createRes.body.proveedor.id;

    const gerenteAuth = await loginAs('gerente@tumifact.com');
    const updateRes = await withAuth(request(app).put(`/api/proveedores/${id}`), gerenteAuth).send({
      nombre: 'Proveedor Actualizado',
      telefono: '3119998877',
      plazo_pago_dias: 60,
    });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.proveedor.nombre).toBe('Proveedor Actualizado');
    expect(updateRes.body.proveedor.plazo_pago_dias).toBe(60);
  });

  it('desactiva proveedor con admin (soft-delete activo=false) → 200', async () => {
    const adminAuth = await loginAs('admin@tumifact.com');
    const createRes = await withAuth(request(app).post('/api/proveedores'), adminAuth).send({
      nombre: 'Proveedor Para Eliminar',
    });
    expect(createRes.status).toBe(201);
    const id = createRes.body.proveedor.id;

    const delRes = await withAuth(request(app).delete(`/api/proveedores/${id}`), adminAuth);
    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toMatch(/eliminado/i);

    // No debe aparecer en el listado activo
    const listRes = await withAuth(request(app).get('/api/proveedores'), adminAuth);
    expect(listRes.body.some((p: any) => p.id === id)).toBe(false);
  });

  it('rechaza crear proveedor con rol cajero/empleado → 403', async () => {
    const cajeroAuth = await loginAs('ventas1@tumifact.com');
    const res = await withAuth(request(app).post('/api/proveedores'), cajeroAuth).send({
      nombre: 'Proveedor Rechazado',
    });
    expect(res.status).toBe(403);
  });

  it('rechaza crear proveedor sin auth → 401', async () => {
    const res = await request(app).post('/api/proveedores').send({
      nombre: 'Sin Auth',
    });
    expect(res.status).toBe(401);
  });
});
