import argon2 from 'argon2';
import { pool } from '../src/db/index';

/**
 * Helper Drizzle para tests Vitest (Fase 1 Strangler)
 * Reemplaza tests/helpers.js (pg.Client crudo) usando el pool único de Drizzle.
 * Mantiene TRUNCATE + RESTART IDENTITY para aislamiento entre tests.
 */
export async function truncateAll(): Promise<void> {
  // pool es pg.Pool — query funciona igual que Drizzle drizzle(pool)
  await pool.query(`
    TRUNCATE productos, clientes, facturas, detalle_factura, configuracion_impresion,
             usuarios, empleados, sesiones_caja, categorias_producto, proveedores,
             descuentos, separados, separados_productos, abonos_separado, devoluciones,
             detalle_devolucion, movimientos_inventario, audit_log, auth_sessions
    RESTART IDENTITY CASCADE
  `);

  await pool.query(`
    INSERT INTO tipos_identificacion (codigo, nombre, aplica_a) VALUES
      ('CC', 'Cédula de Ciudadanía', 'persona'),
      ('NIT', 'Número de Identificación Tributaria', 'empresa')
    ON CONFLICT (codigo) DO NOTHING;

    INSERT INTO roles (nombre, descripcion, permisos) VALUES
      ('admin', 'Administrador', '{"admin":true}'::jsonb),
      ('gerente', 'Gerente', '{"ventas":true}'::jsonb),
      ('empleado', 'Empleado', '{"caja":true}'::jsonb)
    ON CONFLICT (nombre) DO NOTHING;
  `);

  const hash = await argon2.hash('Password*2026');
  await pool.query(
    `INSERT INTO usuarios (id, nombre, apellido, numero_identificacion, email, password_hash, rol_id, activo)
     VALUES (1, 'Hack', 'Tu', '10000001', 'admin@tumifact.com', $1, 1, true)
     ON CONFLICT (id) DO NOTHING;`,
    [hash]
  );
  // Avanzar secuencia de usuarios tras insert explícito con id=1 (RESTART IDENTITY la deja en 1)
  await pool.query(`SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios))`);
}
