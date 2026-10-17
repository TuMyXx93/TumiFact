import { prisma } from './prisma';

export async function recordAudit(params: {
  usuarioId?: number | null;
  accion: string;
  entidad?: string;
  entidadId?: number;
  datosNuevos?: unknown;
}) {
  try {
    await prisma.audit_log.create({
      data: {
        usuario_id: params.usuarioId ?? null,
        accion: params.accion,
        entidad: params.entidad ?? null,
        entidad_id: params.entidadId ?? null,
        datos_nuevos: params.datosNuevos as any,
      },
    });
  } catch {
    // Audit must not break business operation.
  }
}
