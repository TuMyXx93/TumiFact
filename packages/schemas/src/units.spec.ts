import { describe, expect, it } from 'vitest';
import { validarAtributos as validarAttrs } from './attributes';
import { convertirABase, convertirAPresentacion, crearHistorialPrecio } from './units';

describe('units', () => {
  it('converts presentation to base', () => {
    expect(convertirABase(1, 12)).toBe(12);
  });

  it('converts base to presentation', () => {
    expect(convertirAPresentacion(12, 12)).toBe(1);
  });

  it('creates price history', () => {
    const h = crearHistorialPrecio(1, 1000, 1200, 2);
    expect(h.productoId).toBe(1);
    expect(h.precioNuevo).toBe(1200);
  });

  it('validates category attributes', () => {
    expect(validarAttrs('tecnologia', { memoria: 8 })).toEqual({ valid: true, invalidos: [] });
    expect(validarAttrs('tecnologia', { talla: 'M' }).valid).toBe(false);
  });
});
