import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit';
import { authenticate, requireRole } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

const createSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  tipo: z.enum(['porcentaje', 'monto_fijo']),
  valor: z.coerce.number().min(0),
  aplica_a: z.enum(['linea', 'total']).default('linea'),
  requiere_aprobacion: z.boolean().default(false),
  vigencia_desde: z.string().optional(),
  vigencia_hasta: z.string().optional(),
});

const updateSchema = createSchema.partial();

/** Descuentos activos y dentro de vigencia (R-007). */
function vigenteAhora(
  descuento: { activo: boolean; vigencia_desde: Date | null; vigencia_hasta: Date | null },
  hoy: Date
) {
  if (!descuento.activo) return false;
  if (descuento.vigencia_desde && hoy < descuento.vigencia_desde) return false;
  if (descuento.vigencia_hasta && hoy > descuento.vigencia_hasta) return false;
  return true;
}

export async function discountsRoutes(app: FastifyInstance) {
  // Catálogo vigente (R-007)
  app.get('/discounts', { preHandler: [authenticate] }, async (_request, reply) => {
    const hoy = new Date();
    const lista = await prisma.descuentos.findMany({ orderBy: { created_at: 'desc' } });
    return reply.send({
      data: lista.filter((d) => vigenteAhora(d, hoy)),
      vigentes_hoy: lista.filter((d) => vigenteAhora(d, hoy)).length,
    });
  });

  app.get('/discounts/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const descuento = await prisma.descuentos.findUnique({ where: { id } });
    if (!descuento) return reply.status(404).send({ error: 'Descuento no encontrado' });
    return reply.send({ data: descuento });
  });

  // Alta de descuento (solo quien gestiona descuentos)
  app.post(
    '/discounts',
    { preHandler: [authenticate, requireRole(['gerente', 'admin'])] },
    async (request, reply) => {
      const parsed = createSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });
      }
      const input = parsed.data;

      const descuento = await prisma.descuentos.create({
        data: {
          nombre: input.nombre,
          descripcion: input.descripcion || null,
          tipo: input.tipo,
          valor: input.valor,
          aplica_a: input.aplica_a,
          requiere_aprobacion: input.requiere_aprobacion,
          vigente_desde: input.vigencia_desde ? new Date(input.vigencia_desde) : null,
          vigente_hasta: input.vigencia_hasta ? new Date(input.vigencia_hasta) : null,
          activo: true,
        },
      });

      return reply.status(201).send({ data: descuento });
    }
  );

  app.patch(
    '/discounts/:id',
    { preHandler: [authenticate, requireRole(['gerente', 'admin'])] },
    async (request, reply) => {
      const id = Number((request.params as any).id);
      const parsed = updateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });
      }
      const input = parsed.data;

      const existente = await prisma.descuentos.findUnique({ where: { id } });
      if (!existente) return reply.status(404).send({ error: 'Descuento no encontrado' });

      const data: any = {};
      if (input.nombre !== undefined) data.nombre = input.nombre;
      if (input.descripcion !== undefined) data.descripcion = input.descripcion;
      if (input.tipo !== undefined) data.tipo = input.tipo;
      if (input.valor !== undefined) data.valor = input.valor;
      if (input.aplica_a !== undefined) data.aplica_a = input.aplica_a;
      if (input.requiere_aprobacion !== undefined)
        data.requiere_aprobacion = input.requiere_aprobacion;
      if (input.vigencia_desde !== undefined)
        data.vigencia_desde = input.vigencia_desde ? new Date(input.vigencia_desde) : null;
      if (input.vigencia_hasta !== undefined)
        data.vigencia_hasta = input.vigencia_hasta ? new Date(input.vigencia_hasta) : null;

      const descuento = await prisma.descuentos.update({ where: { id }, data });

      await recordAudit({
        usuarioId: (request as any).actor?.id,
        accion: 'DESCUENTO_ACTUALIZADO',
        entidad: 'descuentos',
        entidadId: id,
        datosNuevos: input,
      });

      return reply.send({ data: descuento });
    }
  );
}
