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
  await db.end();
  process.exit(0);
}

seedAdmin().catch(async (err) => {
  console.error('❌ Error en seed-admin:', err);
  await db.end().catch(() => {});
  process.exit(1);
});
