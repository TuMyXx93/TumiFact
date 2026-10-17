import { z } from 'zod';

export const ConfiguracionFiscalDTO = z.object({
  nit: z.string().min(1),
  razon_social: z.string().min(1),
  resolucion_numero: z.string().min(1),
  prefijo: z.string().min(1),
  rango_desde: z.coerce.number().int().positive(),
  rango_hasta: z.coerce.number().int().positive(),
  fecha_vigencia_desde: z.string(),
  fecha_vigencia_hasta: z.string(),
  ambiente: z.enum(['habilitacion', 'produccion']).default('habilitacion'),
});

export type ConfiguracionFiscalInput = z.infer<typeof ConfiguracionFiscalDTO>;

export const DocumentoElectronicoEstado = z.enum(['pendiente', 'validado', 'rechazado']);
export type DocumentoElectronicoEstado = z.infer<typeof DocumentoElectronicoEstado>;

export interface DocumentoElectronicoPendiente {
  ventaId: number;
  estado: 'pendiente';
  creadoEn: string;
}

export function crearDocumentoElectronicoPendiente(ventaId: number): DocumentoElectronicoPendiente {
  return {
    ventaId,
    estado: 'pendiente',
    creadoEn: new Date().toISOString(),
  };
}

export interface UBLInvoiceInput {
  id: string;
  fecha: string;
  nitEmisor: string;
  nitReceptor: string;
  total: number;
}

export function generarUBL21(input: UBLInvoiceInput): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${input.id}</cbc:ID>
  <cbc:IssueDate>${input.fecha}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
  <cac:AccountingSupplierParty>
    <cac:Party><cac:PartyIdentification><cbc:ID>${input.nitEmisor}</cbc:ID></cac:PartyIdentification></cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party><cac:PartyIdentification><cbc:ID>${input.nitReceptor}</cbc:ID></cac:PartyIdentification></cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="COP">${input.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
}
