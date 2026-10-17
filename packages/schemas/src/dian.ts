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

export interface CUFEInput {
  numeroFactura: string;
  fecha: string;
  hora: string;
  valorBruto: number;
  codigoImpuesto: string;
  valorImpuesto: number;
  valorTotal: number;
  nitEmisor: string;
  nitReceptor: string;
  claveTecnica: string;
}

export function calcularCUFE(input: CUFEInput): string {
  const base = [
    input.numeroFactura,
    input.fecha,
    input.hora,
    input.valorBruto.toFixed(2),
    input.codigoImpuesto,
    input.valorImpuesto.toFixed(2),
    input.valorTotal.toFixed(2),
    input.nitEmisor,
    input.nitReceptor,
    input.claveTecnica,
  ].join('');

  // Hash simple reproducible para esqueleto; en producción usar SHA-384/SHA-256 según DIAN.
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(40, '0');
}

export function firmarXML(xml: string, certificadoBase64: string): string {
  // Esqueleto: en producción usar firma XAdES-EPES con certificado válido.
  return `<!-- FIRMADO -->\n${xml}\n<!-- CERT: ${certificadoBase64.slice(0, 12)}... -->`;
}

export type EstadoDIAN = 'pendiente' | 'validado' | 'rechazado';

export interface ResultadoDIAN {
  estado: EstadoDIAN;
  cufe?: string;
  mensaje: string;
}

export async function enviarADIAN(xmlFirmado: string): Promise<ResultadoDIAN> {
  // Esqueleto: integrar HTTP client real hacia proveedor/DIAN.
  if (!xmlFirmado) {
    return { estado: 'rechazado', mensaje: 'XML vacío' };
  }
  return { estado: 'pendiente', mensaje: 'Enviado (simulado)' };
}

export interface ConsultaDocumentoDIAN {
  id: string;
  estado: EstadoDIAN;
  cufe?: string;
  xml?: string;
  pdfUrl?: string;
}

export function crearConsultaDocumentoDIAN(
  id: string,
  estado: EstadoDIAN,
  cufe?: string
): ConsultaDocumentoDIAN {
  return { id, estado, cufe };
}
