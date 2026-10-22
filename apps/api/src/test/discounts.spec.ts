import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { ADMIN_CREDENTIALS, EMPLEADO_CREDENTIALS, loginAs } from './helpers';

async function crearVenta(
  app: any,
  auth: { authorization: string },
  payload: Record<string, unknown>
) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/sales',
    headers: { authorization: auth.authorization },
    payload,
  });
}

describe('motor de descuentos (integración)', () => {
  it('aplica un descuento de línea y lo persiste en el detalle', async () => {
    const app = await buildApp();
    const auth = await loginAs(app, ADMIN_CREDENTIALS);

    const productos = (
      await app.inject({
        method: 'GET',
        url: '/api/v1/products',
        headers: { authorization: auth.authorization },
      })
    ).json().data;

    const catalogo = (
      await app.inject({
        method: 'GET',
        url: '/api/v1/discounts',
        headers: { authorization: auth.authorization },
      })
    ).json().data;
    const promoLinea = catalogo.find((d: any) => d.aplica_a === 'linea');

    const res = await crearVenta(app, auth, {
      productos: [{ producto_id: productos[0].id, cantidad: 1, precio: 100000 }],
      descuentos: [{ descuento_id: promoLinea.id, producto_id: productos[0].id }],
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.descuentos.aplicados).toHaveLength(1);
    expect(body.descuentos.descuento_total).toBe(10000);
    expect(Number(body.sale.total)).toBe(90000);

    const detalle = body.sale.detalle_factura[0];
    expect(detalle.descuento_id).toBe(promoLinea.id);
    expect(detalle.descuento_aplicado).toBe('10000');
    expect(detalle.descuento_inline_tipo).toBe('porcentaje');

    await app.close();
  });

  it('rechaza con 422 cuando el descuento excede el límite del cajero', async () => {
    const app = await buildApp();
    const auth = await loginAs(app, EMPLEADO_CREDENTIALS);

    const productos = (
      await app.inject({
        method: 'GET',
        url: '/api/v1/products',
        headers: { authorization: auth.authorization },
      })
    ).json().data;

    const catalogo = (
      await app.inject({
        method: 'GET',
        url: '/api/v1/discounts',
        headers: { authorization: auth.authorization },
      })
    ).json().data;
    const promoLinea = catalogo.find((d: any) => d.aplica_a === 'linea');

    const res = await crearVenta(app, auth, {
      productos: [{ producto_id: productos[0].id, cantidad: 1, precio: 100000 }],
      descuentos: [{ descuento_id: promoLinea.id, producto_id: productos[0].id }],
    });

    // El cajero tiene 5% de límite; la promo es 10%.
    expect(res.statusCode).toBe(422);
    expect(res.json().code).toBe('DESCUENTOS_RECHAZADOS');
    expect(res.json().detalles[0].motivo).toBe('EXCEDE_LIMITE_EMPLEADO');

    await app.close();
  });

  it('exige aprobación para descuentos que la requieren', async () => {
    const app = await buildApp();
    const cajero = await loginAs(app, EMPLEADO_CREDENTIALS);
    const gerente = await loginAs(app, ADMIN_CREDENTIALS);

    const productos = (
      await app.inject({
        method: 'GET',
        url: '/api/v1/products',
        headers: { authorization: gerente.authorization },
      })
    ).json().data;

    const catalogo = (
      await app.inject({
        method: 'GET',
        url: '/api/v1/discounts',
        headers: { authorization: gerente.authorization },
      })
    ).json().data;
    const cupon = catalogo.find((d: any) => d.requiere_aprobacion);

    // El cajero no puede aplicarlo.
    const rechazado = await crearVenta(app, cajero, {
      productos: [{ producto_id: productos[0].id, cantidad: 1, precio: 100000 }],
      descuentos: [{ descuento_id: cupon.id }],
    });
    expect(rechazado.statusCode).toBe(422);
    expect(rechazado.json().detalles[0].motivo).toBe('REQUIERE_APROBACION');

    // Un admin sí puede.
    const aplicado = await crearVenta(app, gerente, {
      productos: [{ producto_id: productos[0].id, cantidad: 1, precio: 100000 }],
      descuentos: [{ descuento_id: cupon.id }],
    });
    expect(aplicado.statusCode).toBe(201);
    expect(aplicado.json().descuentos.descuento_total).toBe(20000);
    expect(Number(aplicado.json().sale.total)).toBe(80000);

    await app.close();
  });

  it('rechaza con 400 cuando el total del cliente no coincide con el calculado', async () => {
    const app = await buildApp();
    const auth = await loginAs(app, ADMIN_CREDENTIALS);

    const productos = (
      await app.inject({
        method: 'GET',
        url: '/api/v1/products',
        headers: { authorization: auth.authorization },
      })
    ).json().data;

    const res = await crearVenta(app, auth, {
      total: 1,
      productos: [{ producto_id: productos[0].id, cantidad: 1, precio: 100000 }],
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('TOTAL_MISMATCH');

    await app.close();
  });

  it('audita los descuentos aplicados', async () => {
    const app = await buildApp();
    const auth = await loginAs(app, ADMIN_CREDENTIALS);

    const productos = (
      await app.inject({
        method: 'GET',
        url: '/api/v1/products',
        headers: { authorization: auth.authorization },
      })
    ).json().data;
    const catalogo = (
      await app.inject({
        method: 'GET',
        url: '/api/v1/discounts',
        headers: { authorization: auth.authorization },
      })
    ).json().data;
    const promoLinea = catalogo.find((d: any) => d.aplica_a === 'linea');

    const res = await crearVenta(app, auth, {
      productos: [{ producto_id: productos[0].id, cantidad: 1, precio: 100000 }],
      descuentos: [{ descuento_id: promoLinea.id, producto_id: productos[0].id }],
    });
    expect(res.statusCode).toBe(201);

    const { prisma } = await import('../lib/prisma');
    const logs = await prisma.audit_log.findMany({
      where: { accion: 'DESCUENTOS_APLICADOS' },
      orderBy: { id: 'desc' },
      take: 1,
    });
    expect(logs.length).toBe(1);
    expect(logs[0].usuario_id).not.toBeNull();

    await prisma.$disconnect();
    await app.close();
  });
});
