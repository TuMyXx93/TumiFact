-- TumiFact v2.0 — Base de Datos PostgreSQL 18.4
-- Schema completo y normalizado (3NF)

-- =====================================================
-- 1. TABLA: tipos_identificacion
-- =====================================================
CREATE TABLE IF NOT EXISTS tipos_identificacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    aplica_a VARCHAR(20) DEFAULT 'todos' NOT NULL
);

INSERT INTO tipos_identificacion (codigo, nombre, aplica_a) VALUES
    ('CC', 'Cédula de Ciudadanía', 'persona'),
    ('NIT', 'Número de Identificación Tributaria', 'empresa'),
    ('CE', 'Cédula de Extranjería', 'persona'),
    ('PP', 'Pasaporte', 'persona'),
    ('TI', 'Tarjeta de Identidad', 'persona'),
    ('RUT', 'Registro Único Tributario', 'todos')
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- 2. TABLA: direcciones
-- =====================================================
CREATE TABLE IF NOT EXISTS direcciones (
    id SERIAL PRIMARY KEY,
    calle TEXT,
    barrio VARCHAR(100),
    ciudad VARCHAR(100) DEFAULT 'Ciudad' NOT NULL,
    departamento VARCHAR(100),
    pais VARCHAR(60) DEFAULT 'Colombia' NOT NULL,
    codigo_postal VARCHAR(20),
    referencia TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. TABLA: roles
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (nombre, descripcion, permisos) VALUES
    ('admin', 'Administrador total del sistema', '{"admin":true,"ventas":true,"inventario":true,"empleados":true,"caja":true,"reportes":true,"configuracion":true,"devoluciones":true,"descuentos":true}'::jsonb),
    ('gerente', 'Gerente de tienda con supervisión', '{"admin":false,"ventas":true,"inventario":true,"empleados":false,"caja":true,"reportes":true,"configuracion":false,"devoluciones":true,"descuentos":true}'::jsonb),
    ('empleado', 'Cajero / Vendedor', '{"admin":false,"ventas":true,"inventario":false,"empleados":false,"caja":true,"reportes":false,"configuracion":false,"devoluciones":false,"descuentos":false}'::jsonb)
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- 4. TABLA: usuarios
-- =====================================================
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. TABLA: empleados
-- =====================================================
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. TABLA: sesiones_caja
-- =====================================================
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
    abierta_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cerrada_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. TABLA: categorias_producto
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    tipo VARCHAR(50) DEFAULT 'generico' NOT NULL,
    descripcion TEXT,
    campos_extra JSONB DEFAULT '[]'::jsonb NOT NULL,
    aplica_inventario BOOLEAN DEFAULT TRUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- 8. TABLA: proveedores
-- =====================================================
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- 9. TABLA: clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80),
    tipo_identificacion_id INTEGER REFERENCES tipos_identificacion(id),
    numero_identificacion VARCHAR(30),
    email VARCHAR(150),
    telefono VARCHAR(20),
    telefono_secundario VARCHAR(20),
    direccion_id INTEGER REFERENCES direcciones(id),
    direccion TEXT,
    direccion_texto TEXT,
    tipo_cliente VARCHAR(20) DEFAULT 'detal' NOT NULL,
    notas TEXT,
    total_compras NUMERIC(14,2) DEFAULT 0 NOT NULL,
    numero_facturas INTEGER DEFAULT 0 NOT NULL,
    ultima_compra TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);

-- =====================================================
-- 10. TABLA: productos
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria_id INTEGER REFERENCES categorias_producto(id),
    proveedor_id INTEGER REFERENCES proveedores(id),
    precio_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_unidad NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_libra NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_detal NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_mayorista NUMERIC(10,2) NOT NULL DEFAULT 0,
    cantidad_mayorista INTEGER DEFAULT 10 NOT NULL,
    stock_actual NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock_minimo NUMERIC(10,2) NOT NULL DEFAULT 5,
    atributos JSONB DEFAULT '{}'::jsonb NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);

-- =====================================================
-- 11. TABLA: descuentos
-- =====================================================
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- 12. TABLA: facturas
-- =====================================================
CREATE TABLE IF NOT EXISTS facturas (
    id SERIAL PRIMARY KEY,
    idempotency_key UUID UNIQUE,
    cliente_id INTEGER CONSTRAINT fk_facturas_cliente REFERENCES clientes(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    sesion_caja_id INTEGER REFERENCES sesiones_caja(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subtotal NUMERIC(12,2) DEFAULT 0 NOT NULL,
    descuento_total NUMERIC(12,2) DEFAULT 0 NOT NULL,
    descuento_detalle JSONB DEFAULT '[]'::jsonb NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    forma_pago VARCHAR(50) DEFAULT 'efectivo' NOT NULL,
    tipo VARCHAR(20) DEFAULT 'contado' NOT NULL,
    estado VARCHAR(20) DEFAULT 'completada' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- 13. TABLA: detalle_factura
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_factura (
    id SERIAL PRIMARY KEY,
    idempotency_key UUID,
    factura_id INTEGER REFERENCES facturas(id) ON DELETE CASCADE NOT NULL,
    producto_id INTEGER REFERENCES productos(id) NOT NULL,
    descuento_id INTEGER REFERENCES descuentos(id),
    descuento_inline_tipo VARCHAR(20),
    descuento_inline_valor NUMERIC(10,2) DEFAULT 0 NOT NULL,
    descuento_aplicado NUMERIC(10,2) DEFAULT 0 NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL,
    precio_original NUMERIC(10,2),
    precio_unitario NUMERIC(10,2) NOT NULL,
    unidad_medida VARCHAR(10) DEFAULT 'KG' NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- 14. TABLA: separados (Layaway)
-- =====================================================
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

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

-- =====================================================
-- 15. TABLA: abonos_separado
-- =====================================================
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- 16. TABLA: devoluciones
-- =====================================================
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

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

-- =====================================================
-- 17. TABLA: movimientos_inventario
-- =====================================================
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- 18. TABLA: audit_log
-- =====================================================
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- 19. TABLA: configuracion_impresion
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracion_impresion (
    id SERIAL PRIMARY KEY,
    nombre_negocio VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    nit VARCHAR(50),
    pie_pagina TEXT,
    ancho_papel INTEGER DEFAULT 80 NOT NULL,
    font_size INTEGER DEFAULT 1 NOT NULL,
    logo_data BYTEA,
    logo_tipo VARCHAR(50),
    qr_data BYTEA,
    qr_tipo VARCHAR(50),
    esquema_colores JSONB DEFAULT '{"primary":"#2563eb","secondary":"#0891b2","accent":"#10b981","background":"#0b0f19","surface":"#0f172a"}'::jsonb NOT NULL,
    mensaje_bienvenida VARCHAR(200) DEFAULT '¡Gracias por su compra!',
    mensaje_pie TEXT DEFAULT '¡Vuelva pronto!',
    politica_devolucion TEXT DEFAULT 'Cambios y devoluciones dentro de los 30 días con el comprobante de compra.',
    politica_separados TEXT DEFAULT 'Plazo máximo de separado: 30 a 45 días. Abonos no reembolsables si vence el plazo.',
    dias_plazo_separado_default INTEGER DEFAULT 30 NOT NULL,
    redes_sociales JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
