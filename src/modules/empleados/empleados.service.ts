import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import { db, pool } from '../../db';
import { empleados } from '../../db/schema/empleados';
import { usuarios } from '../../db/schema/usuarios';
import { recordAudit } from '../../shared/utils/audit';
import type { CreateEmpleadoInput, UpdateEmpleadoInput } from './empleados.dto';
import { EmpleadosRepository } from './empleados.repository';

export class EmpleadosService {
  constructor(private repo: EmpleadosRepository = new EmpleadosRepository()) {}

  async getAll() {
    const list = await this.repo.findAll();
    return list.map((e) => ({
      ...e,
      salario: parseFloat(e.salario || '0'),
      descuento_max_porcentaje: parseFloat(e.descuento_max_porcentaje || '0'),
      descuento_max_monto: parseFloat(e.descuento_max_monto || '0'),
    }));
  }

  async getById(id: number) {
    const e = await this.repo.findById(id);
    if (!e) return null;
    return {
      ...e,
      salario: parseFloat(e.salario || '0'),
      descuento_max_porcentaje: parseFloat(e.descuento_max_porcentaje || '0'),
      descuento_max_monto: parseFloat(e.descuento_max_monto || '0'),
    };
  }

  async create(input: CreateEmpleadoInput, req?: Request) {
    const password_hash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const result = await db.transaction(async (tx) => {
      const userRows = await tx
        .insert(usuarios)
        .values({
          nombre: input.nombre,
          apellido: input.apellido,
          tipo_identificacion_id: input.tipo_identificacion_id || null,
          numero_identificacion: input.numero_identificacion,
          email: input.email.toLowerCase().trim(),
          telefono: input.telefono || null,
          password_hash,
          rol_id: input.rol_id,
          activo: true,
        })
        .returning();

      const newUser = userRows[0];

      const empRows = await tx
        .insert(empleados)
        .values({
          usuario_id: newUser.id,
          cargo: input.cargo || 'Vendedor/Cajero',
          departamento: input.departamento || null,
          salario: input.salario?.toString() || '0',
          turno: input.turno || 'completo',
          descuento_max_porcentaje: (input.descuento_max_porcentaje || 10).toString(),
          descuento_max_monto: (input.descuento_max_monto || 50000).toString(),
        })
        .returning();

      return { ...empRows[0], usuario: newUser };
    });

    // Audit FUERA de la transacción — auto-commit, nunca bloquea
    recordAudit({
      usuarioId: req?.user?.id,
      accion: 'EMPLEADO_CREADO',
      entidad: 'empleados',
      entidadId: result.id,
      datosNuevos: {
        nombre: `${input.nombre} ${input.apellido}`,
        cargo: input.cargo,
        email: input.email,
      },
      req,
    }).catch(() => {}); // fire-and-forget

    return result;
  }

  async update(id: number, input: UpdateEmpleadoInput, req?: Request) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    await db.transaction(async (tx) => {
      const userUpdates: any = { updated_at: new Date() };
      if (input.nombre) userUpdates.nombre = input.nombre;
      if (input.apellido) userUpdates.apellido = input.apellido;
      if (input.email) userUpdates.email = input.email;
      if (input.telefono !== undefined) userUpdates.telefono = input.telefono;
      if (input.numero_identificacion)
        userUpdates.numero_identificacion = input.numero_identificacion;
      if (input.tipo_identificacion_id)
        userUpdates.tipo_identificacion_id = input.tipo_identificacion_id;
      if (input.rol_id) userUpdates.rol_id = input.rol_id;
      if (input.password) {
        userUpdates.password_hash = await argon2.hash(input.password, {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        });
      }

      await tx.update(usuarios).set(userUpdates).where(eq(usuarios.id, existing.usuario_id));

      const empExists = await tx
        .select({ id: empleados.id })
        .from(empleados)
        .where(eq(empleados.usuario_id, existing.usuario_id))
        .limit(1);

      const empUpdates: any = { updated_at: new Date() };
      if (input.cargo) empUpdates.cargo = input.cargo;
      if (input.departamento !== undefined) empUpdates.departamento = input.departamento;
      if (input.salario !== undefined) empUpdates.salario = input.salario.toString();
      if (input.turno) empUpdates.turno = input.turno;
      if (input.descuento_max_porcentaje !== undefined)
        empUpdates.descuento_max_porcentaje = input.descuento_max_porcentaje.toString();
      if (input.descuento_max_monto !== undefined)
        empUpdates.descuento_max_monto = input.descuento_max_monto.toString();

      if (empExists.length > 0) {
        await tx.update(empleados).set(empUpdates).where(eq(empleados.usuario_id, existing.usuario_id));
      } else {
        await tx.insert(empleados).values({
          usuario_id: existing.usuario_id,
          cargo: input.cargo || existing.cargo || 'Vendedor/Cajero',
          departamento: input.departamento !== undefined ? input.departamento : (existing.departamento || null),
          salario: (input.salario !== undefined ? input.salario : (existing.salario || 0)).toString(),
          turno: input.turno || existing.turno || 'completo',
          descuento_max_porcentaje: (input.descuento_max_porcentaje !== undefined ? input.descuento_max_porcentaje : (existing.descuento_max_porcentaje || 10)).toString(),
          descuento_max_monto: (input.descuento_max_monto !== undefined ? input.descuento_max_monto : (existing.descuento_max_monto || 50000)).toString(),
        });
      }
    });

    // Audit FUERA de la transacción — fire-and-forget
    recordAudit({
      usuarioId: req?.user?.id,
      accion: 'EMPLEADO_ACTUALIZADO',
      entidad: 'empleados',
      entidadId: id,
      datosPrevios: existing,
      datosNuevos: input,
      req,
    }).catch(() => {});

    return await this.getById(id);
  }

  async toggleActive(id: number, req?: Request) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    const newActiveState = !existing.activo;
    await db
      .update(usuarios)
      .set({ activo: newActiveState })
      .where(eq(usuarios.id, existing.usuario_id));

    // Audit fuera de cualquier transacción
    recordAudit({
      usuarioId: req?.user?.id,
      accion: newActiveState ? 'EMPLEADO_ACTIVADO' : 'EMPLEADO_DESACTIVADO',
      entidad: 'empleados',
      entidadId: id,
      req,
    }).catch(() => {});

    return { id, activo: newActiveState };
  }

  async delete(id: number, req?: Request) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    // Verificar si el usuario que se intenta eliminar es el mismo que hace la petición
    if (req?.user?.id === existing.usuario_id) {
      const error: any = new Error('No puedes eliminar tu propia cuenta de usuario');
      error.statusCode = 400;
      throw error;
    }

    await db.transaction(async (tx) => {
      // Eliminar registro de empleado
      await tx.delete(empleados).where(eq(empleados.id, id));
      // Eliminar usuario base
      await tx.delete(usuarios).where(eq(usuarios.id, existing.usuario_id));
    });

    // Audit fuera de la transacción
    recordAudit({
      usuarioId: req?.user?.id,
      accion: 'EMPLEADO_ELIMINADO',
      entidad: 'empleados',
      entidadId: id,
      datosPrevios: existing,
      req,
    }).catch(() => {});

    return { id, message: 'Empleado eliminado exitosamente' };
  }

  async getAuditLogs(userId?: number, limit = 50) {
    if (userId) {
      const result = await pool.query(
        `SELECT al.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido, r.nombre as rol_nombre
         FROM audit_log al
         LEFT JOIN usuarios u ON al.usuario_id = u.id
         LEFT JOIN roles r ON u.rol_id = r.id
         WHERE al.usuario_id = $1
         ORDER BY al.created_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows || [];
    }

    const result = await pool.query(
      `SELECT al.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido, r.nombre as rol_nombre
       FROM audit_log al
       LEFT JOIN usuarios u ON al.usuario_id = u.id
       LEFT JOIN roles r ON u.rol_id = r.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows || [];
  }

  async getMetricas() {
    const [totalesRes, ventasPorEmpleadoRes, turnosRes] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(u.id) as total_empleados,
          COUNT(CASE WHEN u.activo = true THEN 1 END) as activos,
          COUNT(CASE WHEN u.activo = false THEN 1 END) as inactivos,
          COALESCE(AVG(NULLIF(e.salario, 0)), 0) as salario_promedio
        FROM usuarios u
        LEFT JOIN empleados e ON e.usuario_id = u.id
      `),
      pool.query(`
        SELECT 
          u.id as usuario_id,
          u.nombre,
          u.apellido,
          r.nombre as rol_nombre,
          COALESCE(SUM(f.total), 0) as total_vendido,
          COUNT(f.id) as total_facturas,
          COALESCE(AVG(f.total), 0) as ticket_promedio
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        LEFT JOIN facturas f ON f.usuario_id = u.id AND f.estado = 'completada'
        WHERE u.activo = true
        GROUP BY u.id, u.nombre, u.apellido, r.nombre
        ORDER BY total_vendido DESC
      `),
      pool.query(`
        SELECT 
          u.id as usuario_id,
          u.nombre,
          u.apellido,
          COUNT(sc.id) as total_turnos_cerrados,
          COALESCE(SUM(sc.diferencia_caja), 0) as diferencia_acumulada
        FROM usuarios u
        JOIN sesiones_caja sc ON sc.usuario_id = u.id
        WHERE sc.estado = 'cerrada'
        GROUP BY u.id, u.nombre, u.apellido
      `),
    ]);

    return {
      resumen: totalesRes.rows[0] || {},
      ventasPorEmpleado: ventasPorEmpleadoRes.rows || [],
      desempenoCaja: turnosRes.rows || [],
    };
  }
}
