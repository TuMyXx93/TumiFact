import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';

describe('returns (devoluciones y cambios)', () => {
  it('procesa un cambio de artículo con diferencia y factura vinculada', async () => {
    const app = await buildApp();

    const productRes = await app.inject({ method: 'GET', url: '/api/v1/products' });
    const products = productRes.json().data;
    const original = products[0];
    const nuevo = products[1];

    // 1) Venta original
    const sale = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      payload: {
        productos: [{ producto_id: original.id, cantidad: 2, precio: 1000 }],
      },
    });
    expect(sale.statusCode).toBe(201);
    const facturaId = sale.json().sale.id;

    const detalleId = sale.json().sale.detalle_factura[0].id;

    // 2) Cambio: devuelve 1 unidad del original y recibe 1 del nuevo
    const cambio = await app.inject({
      method: 'POST',
      url: '/api/v1/returns',
      payload: {
        factura_id: facturaId,
        tipo: 'cambio',
        motivo: 'Producto no le gusta al cliente',
        items: [
          {
            detalle_factura_id: detalleId,
            producto_id: original.id,
            cantidad_devuelta: 1,
            condicion: 'bueno',
            reingresa_inventario: true,
          },
        ],
        cambios: [{ producto_id: nuevo.id, cantidad: 1, precio_unitario: 2500 }],
      },
    });

    expect(cambio.statusCode).toBe(201);
    const body = cambio.json();
    expect(body.total_devuelto).toBe(1000);
    expect(body.total_cambio).toBe(2500);
    expect(body.diferencia).toBe(1500);
    expect(body.factura_id).toBeTruthy();

    // 3) La factura original queda parcialmente devuelta, no se altera su total
    const { prisma } = await import('../lib/prisma');
    const found = await prisma.facturas.findUnique({ where: { id: facturaId } });
    expect(found?.estado).toBe('parcialmente_devuelta');
    expect(Number(found?.total)).toBe(2000);

    // 4) El stock del producto devuelto se reingresa y el nuevo se descuenta
    const stockOriginal = await prisma.productos.findUnique({ where: { id: original.id } });
    const stockNuevo = await prisma.productos.findUnique({ where: { id: nuevo.id } });
    expect(Number(stockOriginal?.stock_actual)).toBeGreaterThanOrEqual(1);

    await prisma.$disconnect();
    await app.close();
  });

  it('rechaza cambio cuando el producto nuevo no tiene stock', async () => {
    const app = await buildApp();
    const products = (await app.inject({ method: 'GET', url: '/api/v1/products' })).json().data;
    const original = products[0];
    const nuevo = products[1];

    const sale = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      payload: { productos: [{ producto_id: original.id, cantidad: 1, precio: 1000 }] },
    });
    const facturaId = sale.json().sale.id;

    const cambio = await app.inject({
      method: 'POST',
      url: '/api/v1/returns',
      payload: {
        factura_id: facturaId,
        tipo: 'cambio',
        motivo: 'Cambio sin stock',
        items: [
          {
            detalle_factura_id: sale.json().sale.detalle_factura[0].id,
            producto_id: original.id,
            cantidad_devuelta: 1,
          },
        ],
        cambios: [{ producto_id: nuevo.id, cantidad: 999999, precio_unitario: 10 }],
      },
    });

    expect(cambio.statusCode).toBe(409);
    expect(cambio.json().code).toBe('INSUFFICIENT_STOCK');
    await app.close();
  });

  it('rechaza devolver más de lo comprado', async () => {
    const app = await buildApp();
    const products = (await app.inject({ method: 'GET', url: '/api/v1/products' })).json().data;
    const original = products[0];

    const sale = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      payload: { productos: [{ producto_id: original.id, cantidad: 1, precio: 1000 }] },
    });
    const facturaId = sale.json().sale.id;

    const devolucion = await app.inject({
      method: 'POST',
      url: '/api/v1/returns',
      payload: {
        factura_id: facturaId,
        tipo: 'devolucion',
        motivo: 'Cantidad excedida',
        items: [
          {
            detalle_factura_id: sale.json().sale.detalle_factura[0].id,
            producto_id: original.id,
            cantidad_devuelta: 5,
          },
        ],
      },
    });

    expect(devolucion.statusCode).toBe(400);
    expect(devolucion.json().code).toBe('INVALID_RETURN_QUANTITY');
    await app.close();
  });
});
