Loaded Prisma config from prisma7.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "abonos_separado" (
    "id" SERIAL NOT NULL,
    "idempotency_key" UUID,
    "separado_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "sesion_caja_id" INTEGER,
    "numero_abono" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "forma_pago" VARCHAR(30) NOT NULL DEFAULT 'efectivo',
    "referencia_pago" VARCHAR(100),
    "notas" TEXT,
    "es_abono_final" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonos_separado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" INTEGER,
    "sesion_caja_id" INTEGER,
    "accion" VARCHAR(100) NOT NULL,
    "entidad" VARCHAR(50),
    "entidad_id" INTEGER,
    "datos_previos" JSONB,
    "datos_nuevos" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "resultado" VARCHAR(20) NOT NULL DEFAULT 'ok',
    "mensaje_error" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "revoked_at" TIMESTAMP(6),
    "replaced_by" UUID,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(6),

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_producto" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL DEFAULT 'generico',
    "descripcion" TEXT,
    "campos_extra" JSONB NOT NULL DEFAULT '[]',
    "aplica_inventario" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "direccion" TEXT,
    "telefono" VARCHAR(20),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "apellido" VARCHAR(80),
    "tipo_identificacion_id" INTEGER,
    "numero_identificacion" VARCHAR(30),
    "email" VARCHAR(150),
    "telefono_secundario" VARCHAR(20),
    "direccion_id" INTEGER,
    "direccion_texto" TEXT,
    "tipo_cliente" VARCHAR(20) DEFAULT 'detal',
    "notas" TEXT,
    "total_compras" DECIMAL(14,2) DEFAULT 0,
    "numero_facturas" INTEGER DEFAULT 0,
    "ultima_compra" TIMESTAMP(6),
    "activo" BOOLEAN DEFAULT true,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_impresion" (
    "id" SERIAL NOT NULL,
    "nombre_negocio" VARCHAR(100) NOT NULL,
    "direccion" TEXT,
    "telefono" VARCHAR(20),
    "nit" VARCHAR(50),
    "pie_pagina" TEXT,
    "ancho_papel" INTEGER DEFAULT 80,
    "font_size" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "logo_data" BYTEA,
    "logo_tipo" VARCHAR(50),
    "qr_data" BYTEA,
    "qr_tipo" VARCHAR(50),
    "esquema_colores" JSONB DEFAULT '{"accent": "#10b981", "primary": "#2563eb", "surface": "#0f172a", "secondary": "#0891b2", "background": "#0b0f19"}',
    "mensaje_bienvenida" VARCHAR(200) DEFAULT '¡Gracias por su compra!',
    "mensaje_pie" TEXT DEFAULT '¡Vuelva pronto!',
    "politica_devolucion" TEXT DEFAULT 'Cambios y devoluciones dentro de los 30 días con el comprobante de compra.',
    "politica_separados" TEXT DEFAULT 'Plazo máximo de separado: 30 a 45 días. Abonos no reembolsables si vence el plazo.',
    "dias_plazo_separado_default" INTEGER DEFAULT 30,
    "redes_sociales" JSONB DEFAULT '{}',

    CONSTRAINT "configuracion_impresion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuentos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "tipo" VARCHAR(30) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "aplica_a" VARCHAR(20) NOT NULL DEFAULT 'total',
    "requiere_aprobacion" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "vigencia_desde" DATE,
    "vigencia_hasta" DATE,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "descuentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_devolucion" (
    "id" SERIAL NOT NULL,
    "devolucion_id" INTEGER NOT NULL,
    "detalle_factura_id" INTEGER,
    "producto_id" INTEGER NOT NULL,
    "cantidad_devuelta" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal_devuelto" DECIMAL(10,2) NOT NULL,
    "motivo_item" TEXT,
    "condicion" VARCHAR(30) NOT NULL DEFAULT 'bueno',
    "reingresa_inventario" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "detalle_devolucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_factura" (
    "id" SERIAL NOT NULL,
    "factura_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "unidad_medida" VARCHAR(10) NOT NULL DEFAULT 'KG',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" UUID,
    "descuento_id" INTEGER,
    "descuento_inline_tipo" VARCHAR(20),
    "descuento_inline_valor" DECIMAL(10,2) DEFAULT 0,
    "descuento_aplicado" DECIMAL(10,2) DEFAULT 0,
    "precio_original" DECIMAL(10,2),

    CONSTRAINT "detalle_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" SERIAL NOT NULL,
    "idempotency_key" UUID,
    "factura_id" INTEGER NOT NULL,
    "usuario_solicitante_id" INTEGER NOT NULL,
    "usuario_aprobador_id" INTEGER,
    "sesion_caja_id" INTEGER,
    "tipo" VARCHAR(25) NOT NULL,
    "motivo" VARCHAR(100) NOT NULL,
    "descripcion_detallada" TEXT,
    "monto_devuelto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "forma_devolucion" VARCHAR(30) NOT NULL DEFAULT 'efectivo',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'aprobada',
    "fecha_aprobacion" TIMESTAMP(6),
    "notas_aprobador" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direcciones" (
    "id" SERIAL NOT NULL,
    "calle" TEXT,
    "barrio" VARCHAR(100),
    "ciudad" VARCHAR(100) NOT NULL DEFAULT 'Ciudad',
    "departamento" VARCHAR(100),
    "pais" VARCHAR(60) NOT NULL DEFAULT 'Colombia',
    "codigo_postal" VARCHAR(20),
    "referencia" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "cargo" VARCHAR(100) NOT NULL DEFAULT 'Vendedor/Cajero',
    "departamento" VARCHAR(100),
    "salario" DECIMAL(12,2) DEFAULT 0,
    "fecha_ingreso" DATE DEFAULT CURRENT_DATE,
    "turno" VARCHAR(20) DEFAULT 'completo',
    "descuento_max_porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "descuento_max_monto" DECIMAL(10,2) NOT NULL DEFAULT 50000.00,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER,
    "fecha" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(10,2) NOT NULL,
    "forma_pago" VARCHAR(50) NOT NULL DEFAULT 'efectivo',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" UUID,
    "usuario_id" INTEGER,
    "sesion_caja_id" INTEGER,
    "subtotal" DECIMAL(12,2) DEFAULT 0,
    "descuento_total" DECIMAL(12,2) DEFAULT 0,
    "descuento_detalle" JSONB DEFAULT '[]',
    "tipo" VARCHAR(20) DEFAULT 'contado',
    "estado" VARCHAR(30) DEFAULT 'completada',

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" BIGSERIAL NOT NULL,
    "idempotency_key" UUID,
    "producto_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "sesion_caja_id" INTEGER,
    "tipo" VARCHAR(40) NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "stock_anterior" DECIMAL(10,2) NOT NULL,
    "stock_nuevo" DECIMAL(10,2) NOT NULL,
    "costo_unitario" DECIMAL(10,2),
    "referencia_tipo" VARCHAR(30),
    "referencia_id" INTEGER,
    "notas" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "precio_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio_unidad" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio_libra" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,
    "categoria_id" INTEGER,
    "proveedor_id" INTEGER,
    "precio_detal" DECIMAL(10,2) DEFAULT 0,
    "precio_mayorista" DECIMAL(10,2) DEFAULT 0,
    "cantidad_mayorista" INTEGER DEFAULT 10,
    "stock_actual" DECIMAL(10,2) DEFAULT 0,
    "stock_minimo" DECIMAL(10,2) DEFAULT 5,
    "atributos" JSONB DEFAULT '{}',
    "activo" BOOLEAN DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "razon_social" VARCHAR(150),
    "tipo_identificacion_id" INTEGER,
    "numero_identificacion" VARCHAR(30),
    "contacto_nombre" VARCHAR(100),
    "email" VARCHAR(150),
    "telefono" VARCHAR(20),
    "telefono_secundario" VARCHAR(20),
    "website" VARCHAR(200),
    "direccion_id" INTEGER,
    "plazo_pago_dias" INTEGER NOT NULL DEFAULT 30,
    "moneda" VARCHAR(10) NOT NULL DEFAULT 'COP',
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "permisos" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "separados" (
    "id" SERIAL NOT NULL,
    "idempotency_key" UUID,
    "cliente_id" INTEGER NOT NULL,
    "usuario_apertura_id" INTEGER NOT NULL,
    "sesion_caja_id" INTEGER,
    "descripcion" TEXT NOT NULL,
    "observaciones" TEXT,
    "valor_total" DECIMAL(12,2) NOT NULL,
    "abono_inicial" DECIMAL(12,2) NOT NULL,
    "total_abonado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo_pendiente" DECIMAL(12,2) NOT NULL,
    "fecha_inicio" DATE NOT NULL DEFAULT CURRENT_DATE,
    "fecha_limite" DATE NOT NULL,
    "dias_plazo" INTEGER NOT NULL DEFAULT 30,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'activo',
    "factura_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "separados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "separados_productos" (
    "id" SERIAL NOT NULL,
    "separado_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "unidad_medida" VARCHAR(10) NOT NULL DEFAULT 'UND',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "descuento_aplicado" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "separados_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_caja" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'abierta',
    "monto_apertura" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_cierre_declarado" DECIMAL(12,2),
    "monto_cierre_calculado" DECIMAL(12,2) DEFAULT 0,
    "diferencia_caja" DECIMAL(12,2) DEFAULT 0,
    "ventas_efectivo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ventas_transferencia" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ventas_tarjeta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_ventas" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_devoluciones" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_separados_abonos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "numero_transacciones" INTEGER NOT NULL DEFAULT 0,
    "notas" TEXT,
    "abierta_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_identificacion" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "aplica_a" VARCHAR(20) NOT NULL DEFAULT 'todos',

    CONSTRAINT "tipos_identificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "apellido" VARCHAR(80) NOT NULL,
    "tipo_identificacion_id" INTEGER,
    "numero_identificacion" VARCHAR(30),
    "email" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(20),
    "direccion_id" INTEGER,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login" TIMESTAMP(6),
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "abonos_separado_idempotency_key_key" ON "abonos_separado"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "auth_sessions_family_idx" ON "auth_sessions"("family_id");

-- CreateIndex
CREATE INDEX "auth_sessions_user_active_idx" ON "auth_sessions"("usuario_id", "revoked_at", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_producto_nombre_key" ON "categorias_producto"("nombre");

-- CreateIndex
CREATE INDEX "idx_clientes_nombre" ON "clientes"("nombre");

-- CreateIndex
CREATE INDEX "idx_detalle_factura_id" ON "detalle_factura"("factura_id");

-- CreateIndex
CREATE INDEX "idx_detalle_producto_id" ON "detalle_factura"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "devoluciones_idempotency_key_key" ON "devoluciones"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_usuario_id_key" ON "empleados"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_idempotency_key_key" ON "facturas"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_facturas_cliente_id" ON "facturas"("cliente_id");

-- CreateIndex
CREATE INDEX "idx_facturas_fecha" ON "facturas"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "movimientos_inventario_idempotency_key_key" ON "movimientos_inventario"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_key" ON "productos"("codigo");

-- CreateIndex
CREATE INDEX "idx_productos_codigo" ON "productos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "separados_idempotency_key_key" ON "separados"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_identificacion_codigo_key" ON "tipos_identificacion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_numero_identificacion_key" ON "usuarios"("numero_identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "abonos_separado" ADD CONSTRAINT "abonos_separado_separado_id_fkey" FOREIGN KEY ("separado_id") REFERENCES "separados"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "abonos_separado" ADD CONSTRAINT "abonos_separado_sesion_caja_id_fkey" FOREIGN KEY ("sesion_caja_id") REFERENCES "sesiones_caja"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "abonos_separado" ADD CONSTRAINT "abonos_separado_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_sesion_caja_id_fkey" FOREIGN KEY ("sesion_caja_id") REFERENCES "sesiones_caja"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_direccion_id_fkey" FOREIGN KEY ("direccion_id") REFERENCES "direcciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tipo_identificacion_id_fkey" FOREIGN KEY ("tipo_identificacion_id") REFERENCES "tipos_identificacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_devolucion" ADD CONSTRAINT "detalle_devolucion_detalle_factura_id_fkey" FOREIGN KEY ("detalle_factura_id") REFERENCES "detalle_factura"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_devolucion" ADD CONSTRAINT "detalle_devolucion_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_devolucion" ADD CONSTRAINT "detalle_devolucion_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_factura" ADD CONSTRAINT "detalle_factura_descuento_id_fkey" FOREIGN KEY ("descuento_id") REFERENCES "descuentos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_factura" ADD CONSTRAINT "fk_detalle_factura" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_factura" ADD CONSTRAINT "fk_detalle_producto" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_sesion_caja_id_fkey" FOREIGN KEY ("sesion_caja_id") REFERENCES "sesiones_caja"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_usuario_aprobador_id_fkey" FOREIGN KEY ("usuario_aprobador_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_usuario_solicitante_id_fkey" FOREIGN KEY ("usuario_solicitante_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_sesion_caja_id_fkey" FOREIGN KEY ("sesion_caja_id") REFERENCES "sesiones_caja"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "fk_facturas_cliente" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_sesion_caja_id_fkey" FOREIGN KEY ("sesion_caja_id") REFERENCES "sesiones_caja"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_producto"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_direccion_id_fkey" FOREIGN KEY ("direccion_id") REFERENCES "direcciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_tipo_identificacion_id_fkey" FOREIGN KEY ("tipo_identificacion_id") REFERENCES "tipos_identificacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "separados" ADD CONSTRAINT "separados_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "separados" ADD CONSTRAINT "separados_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "separados" ADD CONSTRAINT "separados_sesion_caja_id_fkey" FOREIGN KEY ("sesion_caja_id") REFERENCES "sesiones_caja"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "separados" ADD CONSTRAINT "separados_usuario_apertura_id_fkey" FOREIGN KEY ("usuario_apertura_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "separados_productos" ADD CONSTRAINT "separados_productos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "separados_productos" ADD CONSTRAINT "separados_productos_separado_id_fkey" FOREIGN KEY ("separado_id") REFERENCES "separados"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_direccion_id_fkey" FOREIGN KEY ("direccion_id") REFERENCES "direcciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tipo_identificacion_id_fkey" FOREIGN KEY ("tipo_identificacion_id") REFERENCES "tipos_identificacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

