import argon2 from 'argon2';
import { pool } from '../src/db/index';

export async function runMigrationAndSeed() {
  console.log('🚀 Iniciando migración y seed TumiFact v2.0...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Tipos de identificación
    await client.query(`
      CREATE TABLE IF NOT EXISTS tipos_identificacion (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(10) UNIQUE NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        aplica_a VARCHAR(20) DEFAULT 'todos' NOT NULL
      );
    `);

    // 2. Direcciones normalizadas
    await client.query(`
      CREATE TABLE IF NOT EXISTS direcciones (
        id SERIAL PRIMARY KEY,
        calle TEXT,
        barrio VARCHAR(100),
        ciudad VARCHAR(100) DEFAULT 'Ciudad' NOT NULL,
        departamento VARCHAR(100),
        pais VARCHAR(60) DEFAULT 'Colombia' NOT NULL,
        codigo_postal VARCHAR(20),
        referencia TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Roles
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) UNIQUE NOT NULL,
        descripcion TEXT,
        permisos JSONB DEFAULT '{}'::jsonb NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Usuarios (Argon2id + dual login)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(80) NOT NULL,
        apellido VARCHAR(80) NOT NULL,
        tipo_identificacion_id INTEGER REFERENCES tipos_identificacion(id),
        numero_identificacion VARCHAR(30) UNIQUE,
        email VARCHAR(150) UNIQUE NOT NULL,
        telefono VARCHAR(20),
        direccion_id INTEGER REFERENCES direcciones(id),
        password_hash VARCHAR(255) NOT NULL,
        rol_id INTEGER REFERENCES roles(id) NOT NULL,
        activo BOOLEAN DEFAULT TRUE NOT NULL,
        ultimo_login TIMESTAMP,
        intentos_fallidos INTEGER DEFAULT 0 NOT NULL,
        bloqueado_hasta TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE, family_id UUID NOT NULL, expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP, replaced_by UUID, ip_address VARCHAR(64), user_agent VARCHAR(512),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(), last_used_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS auth_sessions_user_active_idx ON auth_sessions (usuario_id, revoked_at, expires_at);
      CREATE INDEX IF NOT EXISTS auth_sessions_family_idx ON auth_sessions (family_id);
    `);

    // 5. Empleados
    await client.query(`
      CREATE TABLE IF NOT EXISTS empleados (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE NOT NULL,
        cargo VARCHAR(100) DEFAULT 'Vendedor/Cajero' NOT NULL,
        departamento VARCHAR(100),
        salario NUMERIC(12,2) DEFAULT 0,
        fecha_ingreso DATE DEFAULT CURRENT_DATE,
        turno VARCHAR(20) DEFAULT 'completo',
        descuento_max_porcentaje NUMERIC(5,2) DEFAULT 10.00 NOT NULL,
        descuento_max_monto NUMERIC(10,2) DEFAULT 50000.00 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. Sesiones de Caja
    await client.query(`
      CREATE TABLE IF NOT EXISTS sesiones_caja (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) NOT NULL,
        estado VARCHAR(20) DEFAULT 'abierta' NOT NULL,
        monto_apertura NUMERIC(12,2) DEFAULT 0 NOT NULL,
        monto_cierre_declarado NUMERIC(12,2),
        monto_cierre_calculado NUMERIC(12,2) DEFAULT 0,
        diferencia_caja NUMERIC(12,2) DEFAULT 0,
        ventas_efectivo NUMERIC(12,2) DEFAULT 0 NOT NULL,
        ventas_transferencia NUMERIC(12,2) DEFAULT 0 NOT NULL,
        ventas_tarjeta NUMERIC(12,2) DEFAULT 0 NOT NULL,
        total_ventas NUMERIC(12,2) DEFAULT 0 NOT NULL,
        total_devoluciones NUMERIC(12,2) DEFAULT 0 NOT NULL,
        total_separados_abonos NUMERIC(12,2) DEFAULT 0 NOT NULL,
        numero_transacciones INTEGER DEFAULT 0 NOT NULL,
        notas TEXT,
        abierta_at TIMESTAMP DEFAULT NOW() NOT NULL,
        cerrada_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 7. Categorías
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias_producto (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        tipo VARCHAR(50) DEFAULT 'generico' NOT NULL,
        descripcion TEXT,
        campos_extra JSONB DEFAULT '[]'::jsonb NOT NULL,
        aplica_inventario BOOLEAN DEFAULT TRUE NOT NULL,
        activo BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 8. Proveedores
    await client.query(`
      CREATE TABLE IF NOT EXISTS proveedores (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        razon_social VARCHAR(150),
        tipo_identificacion_id INTEGER REFERENCES tipos_identificacion(id),
        numero_identificacion VARCHAR(30),
        contacto_nombre VARCHAR(100),
        email VARCHAR(150),
        telefono VARCHAR(20),
        telefono_secundario VARCHAR(20),
        website VARCHAR(200),
        direccion_id INTEGER REFERENCES direcciones(id),
        plazo_pago_dias INTEGER DEFAULT 30 NOT NULL,
        moneda VARCHAR(10) DEFAULT 'COP' NOT NULL,
        notas TEXT,
        activo BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 9. Actualizar tabla Clientes (columnas nuevas si no existen)
    await client.query(`
      ALTER TABLE clientes
        ADD COLUMN IF NOT EXISTS apellido VARCHAR(80),
        ADD COLUMN IF NOT EXISTS tipo_identificacion_id INTEGER REFERENCES tipos_identificacion(id),
        ADD COLUMN IF NOT EXISTS numero_identificacion VARCHAR(30),
        ADD COLUMN IF NOT EXISTS email VARCHAR(150),
        ADD COLUMN IF NOT EXISTS telefono_secundario VARCHAR(20),
        ADD COLUMN IF NOT EXISTS direccion_id INTEGER REFERENCES direcciones(id),
        ADD COLUMN IF NOT EXISTS direccion_texto TEXT,
        ADD COLUMN IF NOT EXISTS tipo_cliente VARCHAR(20) DEFAULT 'detal',
        ADD COLUMN IF NOT EXISTS notas TEXT,
        ADD COLUMN IF NOT EXISTS total_compras NUMERIC(14,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS numero_facturas INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS ultima_compra TIMESTAMP,
        ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);

    // 10. Actualizar tabla Productos (columnas nuevas si no existen)
    await client.query(`
      ALTER TABLE productos
        ADD COLUMN IF NOT EXISTS descripcion TEXT,
        ADD COLUMN IF NOT EXISTS categoria_id INTEGER REFERENCES categorias_producto(id),
        ADD COLUMN IF NOT EXISTS proveedor_id INTEGER REFERENCES proveedores(id),
        ADD COLUMN IF NOT EXISTS precio_detal NUMERIC(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS precio_mayorista NUMERIC(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS cantidad_mayorista INTEGER DEFAULT 10,
        ADD COLUMN IF NOT EXISTS stock_actual NUMERIC(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS stock_minimo NUMERIC(10,2) DEFAULT 5,
        ADD COLUMN IF NOT EXISTS atributos JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
    `);

    // 11. Descuentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS descuentos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        tipo VARCHAR(30) NOT NULL,
        valor NUMERIC(10,2) NOT NULL,
        aplica_a VARCHAR(20) DEFAULT 'total' NOT NULL,
        requiere_aprobacion BOOLEAN DEFAULT FALSE NOT NULL,
        activo BOOLEAN DEFAULT TRUE NOT NULL,
        vigencia_desde DATE,
        vigencia_hasta DATE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 12. Actualizar Facturas
    await client.query(`
      ALTER TABLE facturas
        ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE,
        ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id),
        ADD COLUMN IF NOT EXISTS sesion_caja_id INTEGER REFERENCES sesiones_caja(id),
        ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS descuento_total NUMERIC(12,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS descuento_detalle JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'contado',
        ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'completada';
    `);

    // 13. Actualizar Detalle Factura
    await client.query(`
      ALTER TABLE detalle_factura
        ADD COLUMN IF NOT EXISTS idempotency_key UUID,
        ADD COLUMN IF NOT EXISTS descuento_id INTEGER REFERENCES descuentos(id),
        ADD COLUMN IF NOT EXISTS descuento_inline_tipo VARCHAR(20),
        ADD COLUMN IF NOT EXISTS descuento_inline_valor NUMERIC(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS descuento_aplicado NUMERIC(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS precio_original NUMERIC(10,2);
    `);

    // 14. Separados (Layaway)
    await client.query(`
      CREATE TABLE IF NOT EXISTS separados (
        id SERIAL PRIMARY KEY,
        idempotency_key UUID UNIQUE,
        cliente_id INTEGER REFERENCES clientes(id) NOT NULL,
        usuario_apertura_id INTEGER REFERENCES usuarios(id) NOT NULL,
        sesion_caja_id INTEGER REFERENCES sesiones_caja(id),
        descripcion TEXT NOT NULL,
        observaciones TEXT,
        valor_total NUMERIC(12,2) NOT NULL,
        abono_inicial NUMERIC(12,2) NOT NULL,
        total_abonado NUMERIC(12,2) DEFAULT 0 NOT NULL,
        saldo_pendiente NUMERIC(12,2) NOT NULL,
        fecha_inicio DATE DEFAULT CURRENT_DATE NOT NULL,
        fecha_limite DATE NOT NULL,
        dias_plazo INTEGER DEFAULT 30 NOT NULL,
        estado VARCHAR(30) DEFAULT 'activo' NOT NULL,
        factura_id INTEGER REFERENCES facturas(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS separados_productos (
        id SERIAL PRIMARY KEY,
        separado_id INTEGER REFERENCES separados(id) ON DELETE CASCADE NOT NULL,
        producto_id INTEGER REFERENCES productos(id) NOT NULL,
        cantidad NUMERIC(10,2) NOT NULL,
        precio_unitario NUMERIC(10,2) NOT NULL,
        unidad_medida VARCHAR(10) DEFAULT 'UND' NOT NULL,
        subtotal NUMERIC(10,2) NOT NULL,
        descuento_aplicado NUMERIC(10,2) DEFAULT 0 NOT NULL
      );
    `);

    // 15. Abonos Separado
    await client.query(`
      CREATE TABLE IF NOT EXISTS abonos_separado (
        id SERIAL PRIMARY KEY,
        idempotency_key UUID UNIQUE,
        separado_id INTEGER REFERENCES separados(id) ON DELETE CASCADE NOT NULL,
        usuario_id INTEGER REFERENCES usuarios(id) NOT NULL,
        sesion_caja_id INTEGER REFERENCES sesiones_caja(id),
        numero_abono INTEGER NOT NULL,
        monto NUMERIC(12,2) NOT NULL,
        forma_pago VARCHAR(30) DEFAULT 'efectivo' NOT NULL,
        referencia_pago VARCHAR(100),
        notas TEXT,
        es_abono_final BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 16. Devoluciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS devoluciones (
        id SERIAL PRIMARY KEY,
        idempotency_key UUID UNIQUE,
        factura_id INTEGER REFERENCES facturas(id) NOT NULL,
        usuario_solicitante_id INTEGER REFERENCES usuarios(id) NOT NULL,
        usuario_aprobador_id INTEGER REFERENCES usuarios(id),
        sesion_caja_id INTEGER REFERENCES sesiones_caja(id),
        tipo VARCHAR(25) NOT NULL,
        motivo VARCHAR(100) NOT NULL,
        descripcion_detallada TEXT,
        monto_devuelto NUMERIC(12,2) DEFAULT 0 NOT NULL,
        forma_devolucion VARCHAR(30) DEFAULT 'efectivo' NOT NULL,
        estado VARCHAR(20) DEFAULT 'aprobada' NOT NULL,
        fecha_aprobacion TIMESTAMP,
        notas_aprobador TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS detalle_devolucion (
        id SERIAL PRIMARY KEY,
        devolucion_id INTEGER REFERENCES devoluciones(id) ON DELETE CASCADE NOT NULL,
        detalle_factura_id INTEGER REFERENCES detalle_factura(id),
        producto_id INTEGER REFERENCES productos(id) NOT NULL,
        cantidad_devuelta NUMERIC(10,2) NOT NULL,
        precio_unitario NUMERIC(10,2) NOT NULL,
        subtotal_devuelto NUMERIC(10,2) NOT NULL,
        motivo_item TEXT,
        condicion VARCHAR(30) DEFAULT 'bueno' NOT NULL,
        reingresa_inventario BOOLEAN DEFAULT TRUE NOT NULL
      );
    `);

    // 17. Movimientos Inventario
    await client.query(`
      CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id BIGSERIAL PRIMARY KEY,
        idempotency_key UUID UNIQUE,
        producto_id INTEGER REFERENCES productos(id) NOT NULL,
        usuario_id INTEGER REFERENCES usuarios(id),
        sesion_caja_id INTEGER REFERENCES sesiones_caja(id),
        tipo VARCHAR(40) NOT NULL,
        cantidad NUMERIC(10,2) NOT NULL,
        stock_anterior NUMERIC(10,2) NOT NULL,
        stock_nuevo NUMERIC(10,2) NOT NULL,
        costo_unitario NUMERIC(10,2),
        referencia_tipo VARCHAR(30),
        referencia_id INTEGER,
        notas TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 18. Audit Log
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id BIGSERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        sesion_caja_id INTEGER REFERENCES sesiones_caja(id),
        accion VARCHAR(100) NOT NULL,
        entidad VARCHAR(50),
        entidad_id INTEGER,
        datos_previos JSONB,
        datos_nuevos JSONB,
        ip_address INET,
        user_agent TEXT,
        resultado VARCHAR(20) DEFAULT 'ok' NOT NULL,
        mensaje_error TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 19. Actualizar configuracion_impresion con white label y políticas
    await client.query(`
      ALTER TABLE configuracion_impresion
        ADD COLUMN IF NOT EXISTS esquema_colores JSONB DEFAULT '{"primary":"#2563eb","secondary":"#0891b2","accent":"#10b981","background":"#0b0f19","surface":"#0f172a"}'::jsonb,
        ADD COLUMN IF NOT EXISTS mensaje_bienvenida VARCHAR(200) DEFAULT '¡Gracias por su compra!',
        ADD COLUMN IF NOT EXISTS mensaje_pie TEXT DEFAULT '¡Vuelva pronto!',
        ADD COLUMN IF NOT EXISTS politica_devolucion TEXT DEFAULT 'Cambios y devoluciones dentro de los 30 días con el comprobante de compra.',
        ADD COLUMN IF NOT EXISTS politica_separados TEXT DEFAULT 'Plazo máximo de separado: 30 a 45 días. Abonos no reembolsables si vence el plazo.',
        ADD COLUMN IF NOT EXISTS dias_plazo_separado_default INTEGER DEFAULT 30,
        ADD COLUMN IF NOT EXISTS redes_sociales JSONB DEFAULT '{}'::jsonb;
    `);

    // ==========================================
    // SEED DE DATOS BÁSICOS
    // ==========================================

    // Seed Tipos de Identificación
    await client.query(`
      INSERT INTO tipos_identificacion (codigo, nombre, aplica_a) VALUES
        ('CC', 'Cédula de Ciudadanía', 'persona'),
        ('NIT', 'Número de Identificación Tributaria', 'empresa'),
        ('CE', 'Cédula de Extranjería', 'persona'),
        ('PP', 'Pasaporte', 'persona'),
        ('TI', 'Tarjeta de Identidad', 'persona'),
        ('RUT', 'Registro Único Tributario', 'todos')
      ON CONFLICT (codigo) DO NOTHING;
    `);

    // Seed Roles
    await client.query(`
      INSERT INTO roles (nombre, descripcion, permisos) VALUES
        ('admin', 'Administrador total del sistema con acceso completo', '{"admin":true,"ventas":true,"inventario":true,"empleados":true,"caja":true,"reportes":true,"configuracion":true,"devoluciones":true,"descuentos":true}'::jsonb),
        ('gerente', 'Gerente de tienda con permisos de supervisión, inventario y reportes', '{"admin":false,"ventas":true,"inventario":true,"empleados":false,"caja":true,"reportes":true,"configuracion":false,"devoluciones":true,"descuentos":true}'::jsonb),
        ('empleado', 'Cajero / Vendedor con permisos de POS y consulta', '{"admin":false,"ventas":true,"inventario":false,"empleados":false,"caja":true,"reportes":false,"configuracion":false,"devoluciones":false,"descuentos":false}'::jsonb)
      ON CONFLICT (nombre) DO NOTHING;
    `);

    // Seed Categorías de Producto
    await client.query(`
      INSERT INTO categorias_producto (nombre, tipo, descripcion, campos_extra) VALUES
        ('Ropa', 'ropa', 'Prendas de vestir, confección, camisas, pantalones y moda', '[{"key":"talla","label":"Talla","type":"string"},{"key":"color","label":"Color","type":"string"},{"key":"genero","label":"Género","type":"select","options":["Hombre","Mujer","Unisex","Niño","Niña"]},{"key":"material","label":"Material","type":"string"}]'::jsonb),
        ('Tecnología', 'tecnologia', 'Equipos electrónicos, cómputo, audio y accesorios', '[{"key":"marca","label":"Marca","type":"string"},{"key":"modelo","label":"Modelo","type":"string"},{"key":"serial","label":"Número Serial","type":"string"},{"key":"garantia_meses","label":"Meses de Garantía","type":"number"}]'::jsonb),
        ('Calzado', 'calzado', 'Zapatos, tenis, botas y sandalias', '[{"key":"talla_calzado","label":"Talla de Calzado","type":"number"},{"key":"color","label":"Color","type":"string"},{"key":"material","label":"Material","type":"string"},{"key":"genero","label":"Género","type":"select","options":["Hombre","Mujer","Unisex","Niño","Niña"]}]'::jsonb),
        ('Artículos', 'articulos', 'Artículos varios, accesorios y miscelánea general del POS', '[{"key":"marca","label":"Marca","type":"string"},{"key":"referencia","label":"Referencia / Modelo","type":"string"},{"key":"presentacion","label":"Presentación","type":"string"}]'::jsonb)
      ON CONFLICT (nombre) DO UPDATE SET
        tipo = EXCLUDED.tipo,
        descripcion = EXCLUDED.descripcion,
        campos_extra = EXCLUDED.campos_extra;
    `);

    const adminPassHash = await argon2.hash('Password*2026', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const ccRow = await client.query("SELECT id FROM tipos_identificacion WHERE codigo = 'CC'");
    const ccId = ccRow.rows[0]?.id || 1;

    const adminRoleRow = await client.query("SELECT id FROM roles WHERE nombre = 'admin'");
    const adminRoleId = adminRoleRow.rows[0]?.id || 1;

    const userRes = await client.query(
      `
      INSERT INTO usuarios (nombre, apellido, tipo_identificacion_id, numero_identificacion, email, telefono, password_hash, rol_id, activo)
      VALUES ('Hack', 'Tu', $1, '10000001', 'admin@tumifact.com', '3014540408', $2, $3, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, numero_identificacion = '10000001', rol_id = $3
      RETURNING id;
    `,
      [ccId, adminPassHash, adminRoleId]
    );

    const adminUserId = userRes.rows[0]?.id;

    // Seed Admin Empleado profile
    if (adminUserId) {
      await client.query(
        `
        INSERT INTO empleados (usuario_id, cargo, departamento, salario, descuento_max_porcentaje, descuento_max_monto)
        VALUES ($1, 'Director General / Administrador', 'Administración', 5000000, 100.00, 10000000.00)
        ON CONFLICT (usuario_id) DO NOTHING;
      `,
        [adminUserId]
      );
    }

    // Seed Demo Gerente & Empleado
    const gerenteRoleRow = await client.query("SELECT id FROM roles WHERE nombre = 'gerente'");
    const gerenteRoleId = gerenteRoleRow.rows[0]?.id || 2;
    const empRoleRow = await client.query("SELECT id FROM roles WHERE nombre = 'empleado'");
    const empRoleId = empRoleRow.rows[0]?.id || 3;

    const gerenteRes = await client.query(
      `
      INSERT INTO usuarios (nombre, apellido, tipo_identificacion_id, numero_identificacion, email, telefono, password_hash, rol_id, activo)
      VALUES ('Carlos', 'Galan', $1, '10000002', 'gerente@tumifact.com', '3001112233', $2, $3, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, numero_identificacion = '10000002', activo = true
      RETURNING id;
    `,
      [ccId, adminPassHash, gerenteRoleId]
    );

    if (gerenteRes.rows[0]?.id) {
      await client.query(
        `
        INSERT INTO empleados (usuario_id, cargo, departamento, salario, descuento_max_porcentaje, descuento_max_monto)
        VALUES ($1, 'Gerente de Tienda', 'Ventas', 3500000, 25.00, 200000.00)
        ON CONFLICT (usuario_id) DO NOTHING;
      `,
        [gerenteRes.rows[0].id]
      );
    }

    const cajeroRes = await client.query(
      `
      INSERT INTO usuarios (nombre, apellido, tipo_identificacion_id, numero_identificacion, email, telefono, password_hash, rol_id, activo)
      VALUES ('Ana', 'Ventas', $1, '10000003', 'ventas1@tumifact.com', '3002223344', $2, $3, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, numero_identificacion = '10000003', activo = true
      RETURNING id;
    `,
      [ccId, adminPassHash, empRoleId]
    );

    if (cajeroRes.rows[0]?.id) {
      await client.query(
        `
        INSERT INTO empleados (usuario_id, cargo, departamento, salario, descuento_max_porcentaje, descuento_max_monto)
        VALUES ($1, 'Cajero Principal', 'Caja', 1600000, 10.00, 50000.00)
        ON CONFLICT (usuario_id) DO NOTHING;
      `,
        [cajeroRes.rows[0].id]
      );
    }

    // Seed Configuración por defecto si está vacía
    const configCheck = await client.query('SELECT id FROM configuracion_impresion LIMIT 1');
    if (configCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO configuracion_impresion (
          nombre_negocio, nit, direccion, telefono, pie_pagina, ancho_papel, font_size,
          mensaje_bienvenida, mensaje_pie, politica_devolucion, politica_separados
        ) VALUES (
          'TumiFact Store', '900.123.456-7', 'Calle 100 #15-20, Bogotá', '+57 300 123 4567',
          '¡Gracias por preferirnos! Guarde este comprobante.', 80, 1,
          '¡Bienvenido a TumiFact Store!', '¡Esperamos verle pronto!',
          'Cambios y devoluciones dentro de los 30 días con el comprobante de compra.',
          'Plazo máximo de separado: 30 a 45 días. Abonos no reembolsables si vence el plazo.'
        );
      `);
    }

    // Asegurar categoría 'Genérico' para productos existentes sin categoría
    const genCatRow = await client.query(
      "SELECT id FROM categorias_producto WHERE nombre = 'Genérico'"
    );
    if (genCatRow.rows[0]?.id) {
      await client.query('UPDATE productos SET categoria_id = $1 WHERE categoria_id IS NULL', [
        genCatRow.rows[0].id,
      ]);
    }

    await client.query('COMMIT');
    console.log('✅ Migración y Seed completados exitosamente.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante migración y seed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module || process.argv[1]?.includes('migrate-and-seed-v2')) {
  runMigrationAndSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
