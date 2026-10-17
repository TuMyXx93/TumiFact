import { describe, expect, it } from 'vitest';
import { crearDocumentoElectronicoPendiente, enviarADIAN } from './dian';

describe('dian', () => {
  it('creates pending document', () => {
    const doc = crearDocumentoElectronicoPendiente(1);
    expect(doc.estado).toBe('pendiente');
  });

  it('rejects empty xml', async () => {
    const result = await enviarADIAN('');
    expect(result.estado).toBe('rechazado');
  });

  it('simulates send', async () => {
    const result = await enviarADIAN('<Invoice />');
    expect(result.estado).toBe('pendiente');
  });
});
