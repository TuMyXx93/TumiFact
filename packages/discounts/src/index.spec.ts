import { describe, expect, it } from 'vitest';
import { calcularDescuentos, type DescuentoCatalogo, type LimitesEmpleado } from './index';

const HOY = new Date('2026-10-22T12:00:00Z');

function descuento(over: Partial<DescuentoCatalogo> = {}): DescuentoCatalogo {
  return {
    id: 1,
    nombre: 'Promo 10%',
    tipo: 'porcentaje',
    valor: 10,
    aplica_a: 'linea',
    requiere_aprobacion: false,
    activo: true,
    vigencia_desde: null,
    vigencia_hasta: null,
    ...over,
  };
}

const LIMITES_CAJERO: LimitesEmpleado = {
  descuento_max_porcentaje: 5,
  descuento_max_monto: 50000,
  puede_aprobar_descuentos: false,
};

const LIMITES_GERENTE: LimitesEmpleado = {
  descuento_max_porcentaje: 50,
  descuento_max_monto: 500000,
  puede_aprobar_descuentos: true,
};

const LINEA = { producto_id: 5, cantidad: 2, precio_unitario: 100000 };

describe('motor de descuentos', () => {
  it('aplica descuento porcentual por línea', () => {
    const r = calcularDescuentos({
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1, producto_id: 5 }],
      descuentos: [descuento({ valor: 10 })],
      limites: LIMITES_GERENTE,
      hoy: HOY,
    });

    expect(r.subtotal).toBe(200000);
    expect(r.descuento_total).toBe(20000);
    expect(r.total).toBe(180000);
    expect(r.aplicados).toHaveLength(1);
    expect(r.lineas[0].descuento_id).toBe(1);
    expect(r.lineas[0].subtotal).toBe(180000);
  });

  it('aplica descuento de monto fijo limitado al subtotal de la línea', () => {
    const r = calcularDescuentos({
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1, producto_id: 5 }],
      descuentos: [descuento({ tipo: 'monto_fijo', valor: 999999 })],
      limites: LIMITES_GERENTE,
      hoy: HOY,
    });

    expect(r.descuento_total).toBe(200000);
    expect(r.total).toBe(0);
  });

  it('aplica descuento sobre el total cuando aplica_a es total', () => {
    const r = calcularDescuentos({
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1 }],
      descuentos: [descuento({ aplica_a: 'total', valor: 10 })],
      limites: LIMITES_GERENTE,
      hoy: HOY,
    });

    expect(r.descuento_total).toBe(20000);
    expect(r.total).toBe(180000);
  });

  it('rechaza descuento inactivo', () => {
    const r = calcularDescuentos({
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1, producto_id: 5 }],
      descuentos: [descuento({ activo: false })],
      limites: LIMITES_GERENTE,
      hoy: HOY,
    });

    expect(r.aplicados).toHaveLength(0);
    expect(r.rechazados[0].motivo).toBe('DESCUENTO_INACTIVO');
    expect(r.total).toBe(200000);
  });

  it('rechaza descuento fuera de vigencia', () => {
    const r = calcularDescuentos({
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1, producto_id: 5 }],
      descuentos: [descuento({ vigencia_desde: new Date('2026-11-01T00:00:00Z') })],
      limites: LIMITES_GERENTE,
      hoy: HOY,
    });

    expect(r.rechazados[0].motivo).toBe('FUERA_DE_VIGENCIA');
  });

  it('rechaza descuento que no aplica al producto', () => {
    const r = calcularDescuentos({
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1, producto_id: 99 }],
      descuentos: [descuento()],
      limites: LIMITES_GERENTE,
      hoy: HOY,
    });

    expect(r.rechazados[0].motivo).toBe('NO_APLICA_A_PRODUCTO');
  });

  it('rechaza descuento que excede el porcentaje máximo del cajero', () => {
    const r = calcularDescuentos({
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1, producto_id: 5 }],
      descuentos: [descuento({ valor: 20 })],
      limites: LIMITES_CAJERO,
      hoy: HOY,
    });

    expect(r.rechazados[0].motivo).toBe('EXCEDE_LIMITE_EMPLEADO');
    expect(r.total).toBe(200000);
  });

  it('rechaza descuento que excede el monto máximo del cajero', () => {
    const r = calcularDescuentos({
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1, producto_id: 5 }],
      descuentos: [descuento({ tipo: 'monto_fijo', valor: 80000 })],
      limites: LIMITES_CAJERO,
      hoy: HOY,
    });

    expect(r.rechazados[0].motivo).toBe('EXCEDE_LIMITE_EMPLEADO');
  });

  it('exige aprobación cuando el descuento la requiere y el cajero no puede aprobar', () => {
    const r = calcularDescuentos({
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1, producto_id: 5 }],
      descuentos: [descuento({ valor: 4, requiere_aprobacion: true })],
      limites: LIMITES_CAJERO,
      hoy: HOY,
    });

    expect(r.rechazados[0].motivo).toBe('REQUIERE_APROBACION');
  });

  it('aplica descuento que requiere aprobación cuando el actor puede aprobar', () => {
    const r = calcularDescuentos({
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1, producto_id: 5 }],
      descuentos: [descuento({ valor: 4, requiere_aprobacion: true })],
      limites: LIMITES_GERENTE,
      hoy: HOY,
    });

    expect(r.aplicados).toHaveLength(1);
    expect(r.descuento_total).toBe(8000);
  });

  it('nunca produce un total negativo', () => {
    const r = calcularDescuentos({
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1 }],
      descuentos: [descuento({ aplica_a: 'total', tipo: 'monto_fijo', valor: 999999 })],
      limites: LIMITES_GERENTE,
      hoy: HOY,
    });

    expect(r.total).toBe(0);
    expect(r.total).toBeGreaterThanOrEqual(0);
  });

  it('es determinista: mismos datos, mismo resultado', () => {
    const params = {
      lineas: [LINEA],
      solicitudes: [{ descuento_id: 1, producto_id: 5 }],
      descuentos: [descuento({ valor: 10 })],
      limites: LIMITES_GERENTE,
      hoy: HOY,
    };
    expect(calcularDescuentos(params)).toEqual(calcularDescuentos(params));
  });
});
