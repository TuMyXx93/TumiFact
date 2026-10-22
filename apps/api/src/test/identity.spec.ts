import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { ADMIN_CREDENTIALS, EMPLEADO_CREDENTIALS, loginAs } from './helpers';

describe('identidad real (empleados, roles, actor)', () => {
  it('no expone password_hash y registra el empleado creado', async () => {
    const app = await buildApp();
    const auth = await loginAs(app);

    const email = `test_${Date.now()}@tumifact.com`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/employees',
      headers: { authorization: auth.authorization },
      payload: {
        nombre: 'Empleado',
        apellido: 'Prueba',
        email,
        password: 'Password*2026',
        rol_nombre: 'empleado',
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).not.toContain('password_hash');
    expect(res.body).not.toContain('argon2');
    expect(res.json().empleado.email).toBe(email);
    await app.close();
  });

  it('rechaza crear empleado con rol inexistente', async () => {
    const app = await buildApp();
    const auth = await loginAs(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/employees',
      headers: { authorization: auth.authorization },
      payload: {
        nombre: 'X',
        apellido: 'Y',
        email: `rol_${Date.now()}@tumifact.com`,
        password: 'Password*2026',
        rol_nombre: 'superadmin',
      },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('un empleado no puede crear empleados (403) y queda auditado', async () => {
    const app = await buildApp();
    const auth = await loginAs(app, EMPLEADO_CREDENTIALS);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/employees',
      headers: { authorization: auth.authorization },
      payload: {
        nombre: 'Intruso',
        apellido: 'X',
        email: `intruso_${Date.now()}@tumifact.com`,
        password: 'Password*2026',
        rol_nombre: 'admin',
      },
    });

    expect(res.statusCode).toBe(403);

    const { prisma } = await import('../lib/prisma');
    const logs = await prisma.audit_log.findMany({
      where: { accion: 'ACCESO_DENEGADO' },
      orderBy: { id: 'desc' },
      take: 1,
    });
    expect(logs.length).toBe(1);
    expect(logs[0].datos_nuevos).toMatchObject({ metodo: 'POST' });

    await prisma.$disconnect();
    await app.close();
  });

  it('la venta registra el usuario_id del cajero autenticado, no un valor fijo', async () => {
    const app = await buildApp();
    const auth = await loginAs(app, EMPLEADO_CREDENTIALS);

    const products = (
      await app.inject({
        method: 'GET',
        url: '/api/v1/products',
        headers: { authorization: auth.authorization },
      })
    ).json().data;

    const sale = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      headers: { authorization: auth.authorization },
      payload: { productos: [{ producto_id: products[0].id, cantidad: 1, precio: 1000 }] },
    });

    expect(sale.statusCode).toBe(201);

    const { prisma } = await import('../lib/prisma');
    const user = await prisma.usuarios.findUnique({
      where: { email: EMPLEADO_CREDENTIALS.credential },
    });
    const factura = await prisma.facturas.findUnique({ where: { id: sale.json().sale.id } });

    expect(user).toBeTruthy();
    expect(factura?.usuario_id).toBe(user!.id);
    expect(factura?.usuario_id).not.toBe(1);

    const movimiento = await prisma.movimientos_inventario.findFirst({
      where: { referencia_tipo: 'factura', referencia_id: factura!.id },
    });
    expect(movimiento?.usuario_id).toBe(user!.id);

    await prisma.$disconnect();
    await app.close();
  });

  it('desactivar un empleado revoca su sesión activa', async () => {
    const app = await buildApp();
    const adminAuth = await loginAs(app, ADMIN_CREDENTIALS);

    const email = `revocar_${Date.now()}@tumifact.com`;
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/employees',
      headers: { authorization: adminAuth.authorization },
      payload: {
        nombre: 'Temporal',
        apellido: 'Sesion',
        email,
        password: 'Password*2026',
        rol_nombre: 'empleado',
      },
    });
    expect(created.statusCode).toBe(201);
    const empleadoId = created.json().empleado.id;

    // El empleado inicia sesión y su token funciona.
    const empleadoAuth = await loginAs(app, { credential: email, password: 'Password*2026' });
    const ok = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: empleadoAuth.authorization },
    });
    expect(ok.statusCode).toBe(200);

    // El admin lo desactiva.
    const off = await app.inject({
      method: 'PATCH',
      url: `/api/v1/employees/${empleadoId}`,
      headers: { authorization: adminAuth.authorization },
      payload: { activo: false },
    });
    expect(off.statusCode).toBe(200);
    expect(off.json().sesionesRevocadas).toBeGreaterThan(0);

    // El token deja de servir.
    const after = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: empleadoAuth.authorization },
    });
    expect(after.statusCode).toBe(401);

    await app.close();
  });

  it('un usuario desactivado no puede iniciar sesión', async () => {
    const app = await buildApp();
    const adminAuth = await loginAs(app, ADMIN_CREDENTIALS);

    const email = `inactivo_${Date.now()}@tumifact.com`;
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/employees',
      headers: { authorization: adminAuth.authorization },
      payload: {
        nombre: 'Inactivo',
        apellido: 'Test',
        email,
        password: 'Password*2026',
        rol_nombre: 'empleado',
      },
    });
    const empleadoId = created.json().empleado.id;

    await app.inject({
      method: 'PATCH',
      url: `/api/v1/employees/${empleadoId}`,
      headers: { authorization: adminAuth.authorization },
      payload: { activo: false },
    });

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { credential: email, password: 'Password*2026' },
    });
    expect(login.statusCode).toBe(403);

    await app.close();
  });

  it('expone los roles canónicos sin datos sensibles', async () => {
    const app = await buildApp();
    const auth = await loginAs(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/roles',
      headers: { authorization: auth.authorization },
    });
    expect(res.statusCode).toBe(200);
    const nombres = res.json().data.map((r: any) => r.nombre);
    expect(nombres).toContain('admin');
    expect(nombres).toContain('gerente');
    expect(nombres).toContain('empleado');
    expect(res.body).not.toContain('password_hash');
    await app.close();
  });
});
