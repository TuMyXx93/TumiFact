import { db } from '../../db';
import { usuarios } from '../../db/schema/usuarios';
import { empleados } from '../../db/schema/empleados';
import { roles } from '../../db/schema/roles';
import { tiposIdentificacion } from '../../db/schema/tipos_identificacion';
import { eq, desc } from 'drizzle-orm';

export class EmpleadosRepository {
  async findAll() {
    return await db
      .select({
        id: empleados.id,
        usuario_id: usuarios.id,
        nombre: usuarios.nombre,
        apellido: usuarios.apellido,
        email: usuarios.email,
        telefono: usuarios.telefono,
        numero_identificacion: usuarios.numero_identificacion,
        tipo_identificacion: tiposIdentificacion.codigo,
        rol_id: usuarios.rol_id,
        rol_nombre: roles.nombre,
        cargo: empleados.cargo,
        departamento: empleados.departamento,
        salario: empleados.salario,
        turno: empleados.turno,
        descuento_max_porcentaje: empleados.descuento_max_porcentaje,
        descuento_max_monto: empleados.descuento_max_monto,
        activo: usuarios.activo,
        ultimo_login: usuarios.ultimo_login,
        created_at: empleados.created_at
      })
      .from(empleados)
      .innerJoin(usuarios, eq(empleados.usuario_id, usuarios.id))
      .leftJoin(roles, eq(usuarios.rol_id, roles.id))
      .leftJoin(tiposIdentificacion, eq(usuarios.tipo_identificacion_id, tiposIdentificacion.id))
      .orderBy(desc(empleados.created_at));
  }

  async findById(id: number) {
    const rows = await db
      .select({
        id: empleados.id,
        usuario_id: usuarios.id,
        nombre: usuarios.nombre,
        apellido: usuarios.apellido,
        email: usuarios.email,
        telefono: usuarios.telefono,
        numero_identificacion: usuarios.numero_identificacion,
        tipo_identificacion_id: usuarios.tipo_identificacion_id,
        tipo_identificacion: tiposIdentificacion.codigo,
        rol_id: usuarios.rol_id,
        rol_nombre: roles.nombre,
        cargo: empleados.cargo,
        departamento: empleados.departamento,
        salario: empleados.salario,
        turno: empleados.turno,
        descuento_max_porcentaje: empleados.descuento_max_porcentaje,
        descuento_max_monto: empleados.descuento_max_monto,
        activo: usuarios.activo,
        ultimo_login: usuarios.ultimo_login
      })
      .from(empleados)
      .innerJoin(usuarios, eq(empleados.usuario_id, usuarios.id))
      .leftJoin(roles, eq(usuarios.rol_id, roles.id))
      .leftJoin(tiposIdentificacion, eq(usuarios.tipo_identificacion_id, tiposIdentificacion.id))
      .where(eq(empleados.id, id))
      .limit(1);
    return rows[0] || null;
  }
}
