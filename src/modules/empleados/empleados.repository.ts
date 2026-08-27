import { desc, eq, or, sql } from 'drizzle-orm';
import { db } from '../../db';
import { empleados } from '../../db/schema/empleados';
import { roles } from '../../db/schema/roles';
import { tiposIdentificacion } from '../../db/schema/tipos_identificacion';
import { usuarios } from '../../db/schema/usuarios';

export class EmpleadosRepository {
  async findAll() {
    return await db
      .select({
        id: sql<number>`COALESCE(${empleados.id}, ${usuarios.id})`.as('id'),
        usuario_id: usuarios.id,
        nombre: usuarios.nombre,
        apellido: usuarios.apellido,
        email: usuarios.email,
        telefono: usuarios.telefono,
        numero_identificacion: usuarios.numero_identificacion,
        tipo_identificacion: tiposIdentificacion.codigo,
        rol_id: usuarios.rol_id,
        rol_nombre: roles.nombre,
        cargo:
          sql<string>`COALESCE(${empleados.cargo}, CASE WHEN ${roles.nombre} = 'admin' THEN 'Administrador General' WHEN ${roles.nombre} = 'gerente' THEN 'Gerente de Tienda' ELSE 'Vendedor/Cajero' END)`.as(
            'cargo'
          ),
        departamento:
          sql<string>`COALESCE(${empleados.departamento}, CASE WHEN ${roles.nombre} = 'admin' THEN 'Dirección' WHEN ${roles.nombre} = 'gerente' THEN 'Operaciones' ELSE 'Ventas' END)`.as(
            'departamento'
          ),
        salario: sql<string>`COALESCE(${empleados.salario}::text, '0')`.as('salario'),
        turno: sql<string>`COALESCE(${empleados.turno}, 'completo')`.as('turno'),
        descuento_max_porcentaje:
          sql<string>`COALESCE(${empleados.descuento_max_porcentaje}::text, CASE WHEN ${roles.nombre} = 'admin' THEN '100.00' WHEN ${roles.nombre} = 'gerente' THEN '30.00' ELSE '10.00' END)`.as(
            'descuento_max_porcentaje'
          ),
        descuento_max_monto:
          sql<string>`COALESCE(${empleados.descuento_max_monto}::text, CASE WHEN ${roles.nombre} = 'admin' THEN '99999999.00' WHEN ${roles.nombre} = 'gerente' THEN '500000.00' ELSE '50000.00' END)`.as(
            'descuento_max_monto'
          ),
        activo: usuarios.activo,
        ultimo_login: usuarios.ultimo_login,
        created_at: sql<Date | null>`COALESCE(${empleados.created_at}, ${usuarios.created_at})`.as(
          'created_at'
        ),
      })
      .from(usuarios)
      .leftJoin(empleados, eq(usuarios.id, empleados.usuario_id))
      .leftJoin(roles, eq(usuarios.rol_id, roles.id))
      .leftJoin(tiposIdentificacion, eq(usuarios.tipo_identificacion_id, tiposIdentificacion.id))
      .orderBy(desc(usuarios.created_at));
  }

  async findById(id: number) {
    const rows = await db
      .select({
        id: sql<number>`COALESCE(${empleados.id}, ${usuarios.id})`.as('id'),
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
        cargo:
          sql<string>`COALESCE(${empleados.cargo}, CASE WHEN ${roles.nombre} = 'admin' THEN 'Administrador General' WHEN ${roles.nombre} = 'gerente' THEN 'Gerente de Tienda' ELSE 'Vendedor/Cajero' END)`.as(
            'cargo'
          ),
        departamento:
          sql<string>`COALESCE(${empleados.departamento}, CASE WHEN ${roles.nombre} = 'admin' THEN 'Dirección' WHEN ${roles.nombre} = 'gerente' THEN 'Operaciones' ELSE 'Ventas' END)`.as(
            'departamento'
          ),
        salario: sql<string>`COALESCE(${empleados.salario}::text, '0')`.as('salario'),
        turno: sql<string>`COALESCE(${empleados.turno}, 'completo')`.as('turno'),
        descuento_max_porcentaje:
          sql<string>`COALESCE(${empleados.descuento_max_porcentaje}::text, CASE WHEN ${roles.nombre} = 'admin' THEN '100.00' WHEN ${roles.nombre} = 'gerente' THEN '30.00' ELSE '10.00' END)`.as(
            'descuento_max_porcentaje'
          ),
        descuento_max_monto:
          sql<string>`COALESCE(${empleados.descuento_max_monto}::text, CASE WHEN ${roles.nombre} = 'admin' THEN '99999999.00' WHEN ${roles.nombre} = 'gerente' THEN '500000.00' ELSE '50000.00' END)`.as(
            'descuento_max_monto'
          ),
        activo: usuarios.activo,
        ultimo_login: usuarios.ultimo_login,
      })
      .from(usuarios)
      .leftJoin(empleados, eq(usuarios.id, empleados.usuario_id))
      .leftJoin(roles, eq(usuarios.rol_id, roles.id))
      .leftJoin(tiposIdentificacion, eq(usuarios.tipo_identificacion_id, tiposIdentificacion.id))
      .where(or(eq(empleados.id, id), eq(usuarios.id, id)))
      .limit(1);
    return rows[0] || null;
  }
}
