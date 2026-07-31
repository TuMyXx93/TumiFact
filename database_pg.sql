-- TumiFact - Base de Datos PostgreSQL 18.4
-- Migración y estandarización para TumiFact
-- 
-- NOTA: Este script se ejecuta en la BD ya creada (tumifact_db)
-- Definida en docker-compose.yml como POSTGRES_DB=tumifact_db

-- =====================================================
-- TABLA: productos
-- =====================================================

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    precio_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_unidad NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_libra NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_productos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_productos_updated_at ON productos;
CREATE TRIGGER trigger_productos_updated_at
BEFORE UPDATE ON productos
FOR EACH ROW
EXECUTE FUNCTION update_productos_timestamp();

-- =====================================================
-- TABLA: clientes
-- =====================================================

CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);

-- =====================================================
-- TABLA: facturas
-- =====================================================

CREATE TABLE IF NOT EXISTS facturas (
    id SERIAL PRIMARY KEY,
    cliente_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10,2) NOT NULL,
    forma_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo'
        CHECK (forma_pago IN ('efectivo', 'transferencia')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_facturas_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_facturas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_facturas_updated_at ON facturas;
CREATE TRIGGER trigger_facturas_updated_at
BEFORE UPDATE ON facturas
FOR EACH ROW
EXECUTE FUNCTION update_facturas_timestamp();

-- =====================================================
-- TABLA: detalle_factura
-- =====================================================

CREATE TABLE IF NOT EXISTS detalle_factura (
    id SERIAL PRIMARY KEY,
    factura_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    unidad_medida VARCHAR(10) NOT NULL DEFAULT 'KG'
        CHECK (unidad_medida IN ('KG', 'UND', 'LB')),
    subtotal NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_detalle_factura 
        FOREIGN KEY (factura_id) REFERENCES facturas(id)
            ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto 
        FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_detalle_factura_id ON detalle_factura(factura_id);
CREATE INDEX IF NOT EXISTS idx_detalle_producto_id ON detalle_factura(producto_id);

-- =====================================================
-- TABLA: configuracion_impresion
-- =====================================================

CREATE TABLE IF NOT EXISTS configuracion_impresion (
    id SERIAL PRIMARY KEY,
    nombre_negocio VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    nit VARCHAR(50),
    pie_pagina TEXT,
    ancho_papel INT DEFAULT 80,
    font_size INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logo_data BYTEA,
    logo_tipo VARCHAR(50),
    qr_data BYTEA,
    qr_tipo VARCHAR(50)
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_configuracion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_configuracion_updated_at ON configuracion_impresion;
CREATE TRIGGER trigger_configuracion_updated_at
BEFORE UPDATE ON configuracion_impresion
FOR EACH ROW
EXECUTE FUNCTION update_configuracion_timestamp();

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE productos IS 'Catálogo de productos de ECL FRUVER';
COMMENT ON TABLE clientes IS 'Información de clientes';
COMMENT ON TABLE facturas IS 'Facturas emitidas';
COMMENT ON TABLE detalle_factura IS 'Detalles de líneas en facturas';
COMMENT ON TABLE configuracion_impresion IS 'Configuración de impresoras y logos';

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================

-- Para verificar las tablas:
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Para verificar triggers:
-- SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';
