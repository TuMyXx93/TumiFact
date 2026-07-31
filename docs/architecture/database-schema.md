# Modelo de Base de Datos PostgreSQL — TumiFact 🗄️

## Diagrama Entidad-Relación (ER)

```mermaid
erDiagram
    CONFIGURACION_IMPRESION {
        int id PK
        string nombre_negocio
        string direccion
        string telefono
        string nit
        string pie_pagina
        int ancho_papel
        int font_size
        bytea logo_data
        string logo_tipo
        bytea qr_data
        string qr_tipo
        timestamp created_at
        timestamp updated_at
    }

    CLIENTES {
        int id PK
        string nombre
        string direccion
        string telefono
        timestamp created_at
    }

    PRODUCTOS {
        int id PK
        string codigo UK
        string nombre
        numeric precio_kg
        numeric precio_unidad
        numeric precio_libra
        timestamp created_at
    }

    FACTURAS {
        int id PK
        int cliente_id FK
        numeric total
        string forma_pago
        timestamp fecha
    }

    DETALLE_FACTURA {
        int id PK
        int factura_id FK
        int producto_id FK
        numeric cantidad
        numeric precio_unitario
        string unidad_medida
        numeric subtotal
    }

    CLIENTES ||--o{ FACTURAS : "posee"
    FACTURAS ||--|{ DETALLE_FACTURA : "contiene"
    PRODUCTOS ||--o{ DETALLE_FACTURA : "referenciado_en"
```

## Especificación de Tablas

### 1. `configuracion_impresion`
Almacena la configuración general de datos fiscales del negocio y los assets gráficos binarios (`BYTEA`) para el tiquete térmico.

### 2. `productos`
Almacena el catálogo de productos con precios por unidad de medida (Kilogramo, Libra, Unidad).

### 3. `clientes`
Directorio de clientes para emisión de facturas.

### 4. `facturas` y `detalle_factura`
Encabezado y líneas de detalle de transacciones de venta de la caja POS.
