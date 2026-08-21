CREATE TABLE "tipos_identificacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(10) NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"aplica_a" varchar(20) DEFAULT 'todos' NOT NULL,
	CONSTRAINT "tipos_identificacion_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "direcciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"calle" text,
	"barrio" varchar(100),
	"ciudad" varchar(100) DEFAULT 'Ciudad' NOT NULL,
	"departamento" varchar(100),
	"pais" varchar(60) DEFAULT 'Colombia' NOT NULL,
	"codigo_postal" varchar(20),
	"referencia" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"descripcion" text,
	"permisos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(80) NOT NULL,
	"apellido" varchar(80) NOT NULL,
	"tipo_identificacion_id" integer,
	"numero_identificacion" varchar(30),
	"email" varchar(150) NOT NULL,
	"telefono" varchar(20),
	"direccion_id" integer,
	"password_hash" varchar(255) NOT NULL,
	"rol_id" integer NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"ultimo_login" timestamp,
	"intentos_fallidos" integer DEFAULT 0 NOT NULL,
	"bloqueado_hasta" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "usuarios_numero_identificacion_unique" UNIQUE("numero_identificacion"),
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "empleados" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"cargo" varchar(100) DEFAULT 'Vendedor/Cajero' NOT NULL,
	"departamento" varchar(100),
	"salario" numeric(12, 2) DEFAULT '0',
	"fecha_ingreso" date DEFAULT now(),
	"turno" varchar(20) DEFAULT 'completo',
	"descuento_max_porcentaje" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"descuento_max_monto" numeric(10, 2) DEFAULT '50000.00' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "empleados_usuario_id_unique" UNIQUE("usuario_id")
);
--> statement-breakpoint
CREATE TABLE "sesiones_caja" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"estado" varchar(20) DEFAULT 'abierta' NOT NULL,
	"monto_apertura" numeric(12, 2) DEFAULT '0' NOT NULL,
	"monto_cierre_declarado" numeric(12, 2),
	"monto_cierre_calculado" numeric(12, 2) DEFAULT '0',
	"diferencia_caja" numeric(12, 2) DEFAULT '0',
	"ventas_efectivo" numeric(12, 2) DEFAULT '0' NOT NULL,
	"ventas_transferencia" numeric(12, 2) DEFAULT '0' NOT NULL,
	"ventas_tarjeta" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_ventas" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_devoluciones" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_separados_abonos" numeric(12, 2) DEFAULT '0' NOT NULL,
	"numero_transacciones" integer DEFAULT 0 NOT NULL,
	"notas" text,
	"abierta_at" timestamp DEFAULT now() NOT NULL,
	"cerrada_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categorias_producto" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"tipo" varchar(50) DEFAULT 'generico' NOT NULL,
	"descripcion" text,
	"campos_extra" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"aplica_inventario" boolean DEFAULT true NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categorias_producto_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "proveedores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"razon_social" varchar(150),
	"tipo_identificacion_id" integer,
	"numero_identificacion" varchar(30),
	"contacto_nombre" varchar(100),
	"email" varchar(150),
	"telefono" varchar(20),
	"telefono_secundario" varchar(20),
	"website" varchar(200),
	"direccion_id" integer,
	"plazo_pago_dias" integer DEFAULT 30 NOT NULL,
	"moneda" varchar(10) DEFAULT 'COP' NOT NULL,
	"notas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"descripcion" text,
	"categoria_id" integer,
	"proveedor_id" integer,
	"precio_kg" numeric(10, 2) DEFAULT '0' NOT NULL,
	"precio_unidad" numeric(10, 2) DEFAULT '0' NOT NULL,
	"precio_libra" numeric(10, 2) DEFAULT '0' NOT NULL,
	"precio_detal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"precio_mayorista" numeric(10, 2) DEFAULT '0' NOT NULL,
	"cantidad_mayorista" integer DEFAULT 10 NOT NULL,
	"stock_actual" numeric(10, 2) DEFAULT '0' NOT NULL,
	"stock_minimo" numeric(10, 2) DEFAULT '5' NOT NULL,
	"atributos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "productos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(80) NOT NULL,
	"apellido" varchar(80),
	"tipo_identificacion_id" integer,
	"numero_identificacion" varchar(30),
	"email" varchar(150),
	"telefono" varchar(20),
	"telefono_secundario" varchar(20),
	"direccion_id" integer,
	"direccion_texto" text,
	"tipo_cliente" varchar(20) DEFAULT 'detal' NOT NULL,
	"notas" text,
	"total_compras" numeric(14, 2) DEFAULT '0' NOT NULL,
	"numero_facturas" integer DEFAULT 0 NOT NULL,
	"ultima_compra" timestamp,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "descuentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"tipo" varchar(30) NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"aplica_a" varchar(20) DEFAULT 'total' NOT NULL,
	"requiere_aprobacion" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"vigencia_desde" date,
	"vigencia_hasta" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facturas" (
	"id" serial PRIMARY KEY NOT NULL,
	"idempotency_key" uuid,
	"cliente_id" integer,
	"usuario_id" integer,
	"sesion_caja_id" integer,
	"fecha" timestamp DEFAULT now() NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"descuento_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"descuento_detalle" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"forma_pago" varchar(50) DEFAULT 'efectivo' NOT NULL,
	"tipo" varchar(20) DEFAULT 'contado' NOT NULL,
	"estado" varchar(20) DEFAULT 'completada' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "facturas_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "detalle_factura" (
	"id" serial PRIMARY KEY NOT NULL,
	"idempotency_key" uuid,
	"factura_id" integer NOT NULL,
	"producto_id" integer NOT NULL,
	"descuento_id" integer,
	"descuento_inline_tipo" varchar(20),
	"descuento_inline_valor" numeric(10, 2) DEFAULT '0' NOT NULL,
	"descuento_aplicado" numeric(10, 2) DEFAULT '0' NOT NULL,
	"cantidad" numeric(10, 2) NOT NULL,
	"precio_original" numeric(10, 2),
	"precio_unitario" numeric(10, 2) NOT NULL,
	"unidad_medida" varchar(10) DEFAULT 'KG' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "separados" (
	"id" serial PRIMARY KEY NOT NULL,
	"idempotency_key" uuid,
	"cliente_id" integer NOT NULL,
	"usuario_apertura_id" integer NOT NULL,
	"sesion_caja_id" integer,
	"descripcion" text NOT NULL,
	"observaciones" text,
	"valor_total" numeric(12, 2) NOT NULL,
	"abono_inicial" numeric(12, 2) NOT NULL,
	"total_abonado" numeric(12, 2) DEFAULT '0' NOT NULL,
	"saldo_pendiente" numeric(12, 2) NOT NULL,
	"fecha_inicio" date DEFAULT now() NOT NULL,
	"fecha_limite" date NOT NULL,
	"dias_plazo" integer DEFAULT 30 NOT NULL,
	"estado" varchar(30) DEFAULT 'activo' NOT NULL,
	"factura_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "separados_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "separados_productos" (
	"id" serial PRIMARY KEY NOT NULL,
	"separado_id" integer NOT NULL,
	"producto_id" integer NOT NULL,
	"cantidad" numeric(10, 2) NOT NULL,
	"precio_unitario" numeric(10, 2) NOT NULL,
	"unidad_medida" varchar(10) DEFAULT 'UND' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"descuento_aplicado" numeric(10, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "abonos_separado" (
	"id" serial PRIMARY KEY NOT NULL,
	"idempotency_key" uuid,
	"separado_id" integer NOT NULL,
	"usuario_id" integer NOT NULL,
	"sesion_caja_id" integer,
	"numero_abono" integer NOT NULL,
	"monto" numeric(12, 2) NOT NULL,
	"forma_pago" varchar(30) DEFAULT 'efectivo' NOT NULL,
	"referencia_pago" varchar(100),
	"notas" text,
	"es_abono_final" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "abonos_separado_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "detalle_devolucion" (
	"id" serial PRIMARY KEY NOT NULL,
	"devolucion_id" integer NOT NULL,
	"detalle_factura_id" integer,
	"producto_id" integer NOT NULL,
	"cantidad_devuelta" numeric(10, 2) NOT NULL,
	"precio_unitario" numeric(10, 2) NOT NULL,
	"subtotal_devuelto" numeric(10, 2) NOT NULL,
	"motivo_item" text,
	"condicion" varchar(30) DEFAULT 'bueno' NOT NULL,
	"reingresa_inventario" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devoluciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"idempotency_key" uuid,
	"factura_id" integer NOT NULL,
	"usuario_solicitante_id" integer NOT NULL,
	"usuario_aprobador_id" integer,
	"sesion_caja_id" integer,
	"tipo" varchar(25) NOT NULL,
	"motivo" varchar(100) NOT NULL,
	"descripcion_detallada" text,
	"monto_devuelto" numeric(12, 2) DEFAULT '0' NOT NULL,
	"forma_devolucion" varchar(30) DEFAULT 'efectivo' NOT NULL,
	"estado" varchar(20) DEFAULT 'aprobada' NOT NULL,
	"fecha_aprobacion" timestamp,
	"notas_aprobador" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "devoluciones_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "movimientos_inventario" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"idempotency_key" uuid,
	"producto_id" integer NOT NULL,
	"usuario_id" integer,
	"sesion_caja_id" integer,
	"tipo" varchar(40) NOT NULL,
	"cantidad" numeric(10, 2) NOT NULL,
	"stock_anterior" numeric(10, 2) NOT NULL,
	"stock_nuevo" numeric(10, 2) NOT NULL,
	"costo_unitario" numeric(10, 2),
	"referencia_tipo" varchar(30),
	"referencia_id" integer,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "movimientos_inventario_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"usuario_id" integer,
	"sesion_caja_id" integer,
	"accion" varchar(100) NOT NULL,
	"entidad" varchar(50),
	"entidad_id" integer,
	"datos_previos" jsonb,
	"datos_nuevos" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"resultado" varchar(20) DEFAULT 'ok' NOT NULL,
	"mensaje_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"family_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"replaced_by" uuid,
	"ip_address" varchar(64),
	"user_agent" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "auth_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "configuracion_impresion" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre_negocio" varchar(100) NOT NULL,
	"direccion" text,
	"telefono" varchar(20),
	"nit" varchar(50),
	"pie_pagina" text,
	"ancho_papel" integer DEFAULT 80 NOT NULL,
	"font_size" integer DEFAULT 1 NOT NULL,
	"logo_data" "bytea",
	"logo_tipo" varchar(50),
	"qr_data" "bytea",
	"qr_tipo" varchar(50),
	"esquema_colores" jsonb DEFAULT '{"primary":"#2563eb","secondary":"#0891b2","accent":"#10b981","background":"#0b0f19","surface":"#0f172a"}'::jsonb NOT NULL,
	"mensaje_bienvenida" varchar(200) DEFAULT '¡Gracias por su compra!',
	"mensaje_pie" text DEFAULT '¡Vuelva pronto!',
	"politica_devolucion" text DEFAULT 'Cambios y devoluciones dentro de los 30 días con el comprobante de compra.',
	"politica_separados" text DEFAULT 'Plazo máximo de separado: 30 a 45 días. Abonos no reembolsables si vence el plazo.',
	"dias_plazo_separado_default" integer DEFAULT 30 NOT NULL,
	"redes_sociales" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tipo_identificacion_id_tipos_identificacion_id_fk" FOREIGN KEY ("tipo_identificacion_id") REFERENCES "public"."tipos_identificacion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_direccion_id_direcciones_id_fk" FOREIGN KEY ("direccion_id") REFERENCES "public"."direcciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_tipo_identificacion_id_tipos_identificacion_id_fk" FOREIGN KEY ("tipo_identificacion_id") REFERENCES "public"."tipos_identificacion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_direccion_id_direcciones_id_fk" FOREIGN KEY ("direccion_id") REFERENCES "public"."direcciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_categorias_producto_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_producto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tipo_identificacion_id_tipos_identificacion_id_fk" FOREIGN KEY ("tipo_identificacion_id") REFERENCES "public"."tipos_identificacion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_direccion_id_direcciones_id_fk" FOREIGN KEY ("direccion_id") REFERENCES "public"."direcciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_sesion_caja_id_sesiones_caja_id_fk" FOREIGN KEY ("sesion_caja_id") REFERENCES "public"."sesiones_caja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_factura" ADD CONSTRAINT "detalle_factura_factura_id_facturas_id_fk" FOREIGN KEY ("factura_id") REFERENCES "public"."facturas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_factura" ADD CONSTRAINT "detalle_factura_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_factura" ADD CONSTRAINT "detalle_factura_descuento_id_descuentos_id_fk" FOREIGN KEY ("descuento_id") REFERENCES "public"."descuentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "separados" ADD CONSTRAINT "separados_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "separados" ADD CONSTRAINT "separados_usuario_apertura_id_usuarios_id_fk" FOREIGN KEY ("usuario_apertura_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "separados" ADD CONSTRAINT "separados_sesion_caja_id_sesiones_caja_id_fk" FOREIGN KEY ("sesion_caja_id") REFERENCES "public"."sesiones_caja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "separados" ADD CONSTRAINT "separados_factura_id_facturas_id_fk" FOREIGN KEY ("factura_id") REFERENCES "public"."facturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "separados_productos" ADD CONSTRAINT "separados_productos_separado_id_separados_id_fk" FOREIGN KEY ("separado_id") REFERENCES "public"."separados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "separados_productos" ADD CONSTRAINT "separados_productos_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abonos_separado" ADD CONSTRAINT "abonos_separado_separado_id_separados_id_fk" FOREIGN KEY ("separado_id") REFERENCES "public"."separados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abonos_separado" ADD CONSTRAINT "abonos_separado_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abonos_separado" ADD CONSTRAINT "abonos_separado_sesion_caja_id_sesiones_caja_id_fk" FOREIGN KEY ("sesion_caja_id") REFERENCES "public"."sesiones_caja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_devolucion" ADD CONSTRAINT "detalle_devolucion_devolucion_id_devoluciones_id_fk" FOREIGN KEY ("devolucion_id") REFERENCES "public"."devoluciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_devolucion" ADD CONSTRAINT "detalle_devolucion_detalle_factura_id_detalle_factura_id_fk" FOREIGN KEY ("detalle_factura_id") REFERENCES "public"."detalle_factura"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_devolucion" ADD CONSTRAINT "detalle_devolucion_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_factura_id_facturas_id_fk" FOREIGN KEY ("factura_id") REFERENCES "public"."facturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_usuario_solicitante_id_usuarios_id_fk" FOREIGN KEY ("usuario_solicitante_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_usuario_aprobador_id_usuarios_id_fk" FOREIGN KEY ("usuario_aprobador_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_sesion_caja_id_sesiones_caja_id_fk" FOREIGN KEY ("sesion_caja_id") REFERENCES "public"."sesiones_caja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_sesion_caja_id_sesiones_caja_id_fk" FOREIGN KEY ("sesion_caja_id") REFERENCES "public"."sesiones_caja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_sesion_caja_id_sesiones_caja_id_fk" FOREIGN KEY ("sesion_caja_id") REFERENCES "public"."sesiones_caja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;