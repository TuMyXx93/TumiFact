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

    INSERT INTO categorias_producto (nombre, tipo, descripcion, campos_extra, activo) VALUES
      ('Ropa', 'ropa', 'Prendas de vestir, confección, camisas, pantalones y moda', '[{"key":"talla","label":"Talla","type":"string"},{"key":"color","label":"Color","type":"string"},{"key":"genero","label":"Género","type":"select","options":["Hombre","Mujer","Unisex","Niño","Niña"]},{"key":"material","label":"Material","type":"string"}]'::jsonb, true),
      ('Tecnología', 'tecnologia', 'Equipos electrónicos, cómputo, audio y accesorios', '[{"key":"marca","label":"Marca","type":"string"},{"key":"modelo","label":"Modelo","type":"string"},{"key":"serial","label":"Número Serial","type":"string"},{"key":"garantia_meses","label":"Meses de Garantía","type":"number"}]'::jsonb, true),
      ('Calzado', 'calzado', 'Zapatos, tenis, botas y sandalias', '[{"key":"talla_calzado","label":"Talla de Calzado","type":"number"},{"key":"color","label":"Color","type":"string"},{"key":"material","label":"Material","type":"string"},{"key":"genero","label":"Género","type":"select","options":["Hombre","Mujer","Unisex","Niño","Niña"]}]'::jsonb, true),
      ('Artículos', 'articulos', 'Artículos varios, accesorios y miscelánea general del POS', '[{"key":"marca","label":"Marca","type":"string"},{"key":"referencia","label":"Referencia / Modelo","type":"string"},{"key":"presentacion","label":"Presentación","type":"string"}]'::jsonb, true)
    ON CONFLICT (nombre) DO UPDATE SET
      tipo = EXCLUDED.tipo,
      descripcion = EXCLUDED.descripcion,
      campos_extra = EXCLUDED.campos_extra,
      activo = EXCLUDED.activo;
  `);

  const hash = await argon2.hash('Password*2026');
  await pool.query(
    `INSERT INTO usuarios (id, nombre, apellido, numero_identificacion, email, password_hash, rol_id, activo)
     VALUES 
       (1, 'Hack', 'Tu', '10000001', 'admin@tumifact.com', $1, 1, true),
       (2, 'Carlos', 'Gerente', '10000002', 'gerente@tumifact.com', $1, 2, true),
       (3, 'Ana', 'Ventas', '10000003', 'ventas1@tumifact.com', $1, 3, true)
     ON CONFLICT (id) DO NOTHING;`,
    [hash]
  );

  await pool.query(`
    INSERT INTO empleados (id, usuario_id, cargo, departamento, salario, turno, descuento_max_porcentaje, descuento_max_monto)
    VALUES
      (1, 1, 'Administrador General', 'Dirección', 5000000, 'completo', 100.00, 99999999.00),
      (2, 2, 'Gerente de Tienda', 'Operaciones', 3500000, 'completo', 30.00, 500000.00),
      (3, 3, 'Cajero POS', 'Ventas', 1500000, 'rotativo', 10.00, 50000.00)
    ON CONFLICT (usuario_id) DO NOTHING;
  `);

  // Avanzar secuencias tras insert explícito con ids
  await pool.query(`SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios))`);
  await pool.query(`SELECT setval('empleados_id_seq', (SELECT MAX(id) FROM empleados))`);
}
