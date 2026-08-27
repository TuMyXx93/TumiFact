require('dotenv').config();
const argon2 = require('argon2');
const { Pool } = require('pg');

const db = new Pool({
  user: process.env.DB_USER || 'tumifact_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'tumifact_db',
  password: process.env.DB_PASSWORD || 'tumifact_password',
  port: Number(process.env.DB_PORT || 5432),
});

async function seedAdmin() {
  console.log('🔄 Ejecutando seed de usuarios y accesos...');

  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error(
      'SEED_ADMIN_PASSWORD es obligatorio y debe tener al menos 12 caracteres. ' +
        'Definirlo en .env antes de ejecutar este script. Ver .env.example.'
    );
  }

  await db.query(`
    INSERT INTO tipos_identificacion (codigo, nombre, aplica_a)
    VALUES ('CC', 'Cédula de ciudadanía', 'persona')
    ON CONFLICT (codigo) DO NOTHING;
  `);
  await db.query(`
    INSERT INTO roles (nombre, descripcion, permisos)
    VALUES
      ('admin', 'Administrador del sistema', '{"admin":true}'::jsonb),
      ('gerente', 'Gerente', '{"facturas:read":true,"reportes:read":true}'::jsonb),
      ('empleado', 'Empleado/Cajero', '{"facturas:create":true,"facturas:read":true}'::jsonb)
    ON CONFLICT (nombre) DO NOTHING;
  `);

  const defaultPasswordHash = await argon2.hash(seedPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const rolAdmin = await db.query("SELECT id FROM roles WHERE nombre = 'admin' LIMIT 1");
  const rolGerente = await db.query("SELECT id FROM roles WHERE nombre = 'gerente' LIMIT 1");
  const rolEmpleado = await db.query("SELECT id FROM roles WHERE nombre = 'empleado' LIMIT 1");
  const tipoCC = await db.query("SELECT id FROM tipos_identificacion WHERE codigo = 'CC' LIMIT 1");

  const adminRoleId = rolAdmin.rows[0]?.id || 1;
  const gerenteRoleId = rolGerente.rows[0]?.id || 2;
  const empRoleId = rolEmpleado.rows[0]?.id || 3;
  const ccId = tipoCC.rows[0]?.id || 1;

  // Insertar o actualizar Admin
  await db.query(
    `
    INSERT INTO usuarios (nombre, apellido, tipo_identificacion_id, numero_identificacion, email, telefono, password_hash, rol_id, activo)
    VALUES ('Hack', 'Tu', $1, '10000001', 'admin@tumifact.com', '3014540408', $2, $3, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $2, numero_identificacion = '10000001', activo = true;
  `,
    [ccId, defaultPasswordHash, adminRoleId]
  );

  // Insertar o actualizar Gerente
  await db.query(
    `
    INSERT INTO usuarios (nombre, apellido, tipo_identificacion_id, numero_identificacion, email, telefono, password_hash, rol_id, activo)
    VALUES ('Carlos', 'Galan', $1, '10000002', 'gerente@tumifact.com', '3001112233', $2, $3, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $2, numero_identificacion = '10000002', activo = true;
  `,
    [ccId, defaultPasswordHash, gerenteRoleId]
  );

  // Insertar o actualizar Cajero (ventas1@tumifact.com)
  await db.query(
    `
    INSERT INTO usuarios (nombre, apellido, tipo_identificacion_id, numero_identificacion, email, telefono, password_hash, rol_id, activo)
    VALUES ('Ana', 'Ventas', $1, '10000003', 'ventas1@tumifact.com', '3002223344', $2, $3, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $2, numero_identificacion = '10000003', activo = true;
  `,
    [ccId, defaultPasswordHash, empRoleId]
  );

  console.log('✅ Usuarios listos para autenticación:');
  console.log(
    '   👑 Admin:   admin@tumifact.com   / 10000001 (clave definida por SEED_ADMIN_PASSWORD)'
  );
  console.log(
    '   👔 Gerente: gerente@tumifact.com / 10000002 (clave definida por SEED_ADMIN_PASSWORD)'
  );
  console.log(
    '   💳 Cajero:  ventas1@tumifact.com / 10000003 (clave definida por SEED_ADMIN_PASSWORD)'
  );

  // BUG FIX (RF#3): seed de categorías, producto demo, configuración y perfiles empleados.
  // Sin esto, la BD queda vacía y el componente Productos defaultea a id=1
  // inexistente (FK violation 23503).
  console.log('🌱 Seed de catálogo demo (categorías, producto, configuración, empleados)...');

  await db.query(`
    INSERT INTO tipos_identificacion (codigo, nombre, aplica_a) VALUES
      ('NIT', 'Número de Identificación Tributaria', 'empresa')
    ON CONFLICT (codigo) DO NOTHING;
  `);

  const nitRow = await db.query("SELECT id FROM tipos_identificacion WHERE codigo = 'NIT' LIMIT 1");
  const nitId = nitRow.rows[0]?.id || null;

  // Categorías (idempotente via ON CONFLICT por nombre)
  await db.query(`
    INSERT INTO categorias_producto (nombre, tipo, descripcion, campos_extra, activo) VALUES
      ('Ropa', 'ropa', 'Prendas de vestir, confección, camisas, pantalones y moda', '[]'::jsonb, true),
      ('Tecnología', 'tecnologia', 'Equipos electrónicos, cómputo, audio y accesorios', '[]'::jsonb, true),
      ('Calzado', 'calzado', 'Zapatos, tenis, botas y sandalias', '[]'::jsonb, true),
      ('Artículos', 'articulos', 'Artículos varios, accesorios y miscelánea general del POS', '[]'::jsonb, true)
    ON CONFLICT (nombre) DO UPDATE SET
      tipo = EXCLUDED.tipo,
      descripcion = EXCLUDED.descripcion,
      activo = EXCLUDED.activo;
  `);

  const catArtRow = await db.query("SELECT id FROM categorias_producto WHERE nombre = 'Artículos' LIMIT 1");
  const catArtId = catArtRow.rows[0]?.id || null;

  // Producto demo (idempotente por codigo)
  if (catGenId) {
    await db.query(
      `INSERT INTO productos (codigo, nombre, descripcion, categoria_id, precio_kg, precio_unidad, precio_libra, precio_detal, precio_mayorista, cantidad_mayorista, stock_actual, stock_minimo, atributos, activo)
       VALUES ('DEMO-001', 'Producto Demo', 'Producto demo creado por seed-admin.js para validar el flujo POS', $1, 1000, 1000, 500, 1000, 800, 12, 100, 5, '{}'::jsonb, true)
       ON CONFLICT (codigo) DO NOTHING`,
      [catGenId]
    );
  }

  // Configuración de impresión por defecto (idempotente via single-row constraint)
  await db.query(`
    INSERT INTO configuracion_impresion (
      nombre_negocio, direccion, telefono, nit, pie_pagina, ancho_papel, font_size,
      esquema_colores, mensaje_bienvenida, mensaje_pie, dias_plazo_separado_default
    ) VALUES (
      'TumiFact Store', 'Calle 100 #15-20, Bogotá', '+57 300 123 4567', '900.123.456-7',
      '¡Gracias por su compra! Guarde este comprobante.', 80, 1,
      '{"primary":"#2563eb","secondary":"#0891b2","accent":"#10b981","background":"#0b0f19","surface":"#0f172a"}'::jsonb,
      '¡Bienvenido a TumiFact Store!', '¡Esperamos verle pronto!', 30
    ) ON CONFLICT (id) DO NOTHING;
  `);

  // Crear perfiles empleados para los usuarios semilla (admin, gerente, cajero)
  const adminUser = await db.query("SELECT id FROM usuarios WHERE email = 'admin@tumifact.com' LIMIT 1");
  const gerenteUser = await db.query("SELECT id FROM usuarios WHERE email = 'gerente@tumifact.com' LIMIT 1");
  const cajeroUser = await db.query("SELECT id FROM usuarios WHERE email = 'ventas1@tumifact.com' LIMIT 1");

  if (adminUser.rows[0]?.id) {
    await db.query(`
      INSERT INTO empleados (usuario_id, cargo, departamento, salario, turno, descuento_max_porcentaje, descuento_max_monto)
      VALUES ($1, 'Administrador General', 'Dirección', 5000000, 'completo', 100, 99999999)
      ON CONFLICT (usuario_id) DO NOTHING
    `, [adminUser.rows[0].id]);
  }

  if (gerenteUser.rows[0]?.id) {
    await db.query(`
      INSERT INTO empleados (usuario_id, cargo, departamento, salario, turno, descuento_max_porcentaje, descuento_max_monto)
      VALUES ($1, 'Gerente de Tienda', 'Operaciones', 3500000, 'completo', 30, 500000)
      ON CONFLICT (usuario_id) DO NOTHING
    `, [gerenteUser.rows[0].id]);
  }

  if (cajeroUser.rows[0]?.id) {
    await db.query(`
      INSERT INTO empleados (usuario_id, cargo, departamento, salario, turno, descuento_max_porcentaje, descuento_max_monto)
      VALUES ($1, 'Cajero POS', 'Ventas', 1500000, 'rotativo', 10, 50000)
      ON CONFLICT (usuario_id) DO NOTHING
    `, [cajeroUser.rows[0].id]);
  }

  console.log('   ✅ Catálogo demo sembrado: 7 categorías + producto DEMO-001 + configuración + perfiles empleados');

  await db.end();
  process.exit(0);
}

seedAdmin().catch(async (err) => {
  console.error('❌ Error en seed-admin:', err);
  await db.end().catch(() => {});
  process.exit(1);
});
