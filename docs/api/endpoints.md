# Especificación de API REST — TumiFact 🔌

## 1. Facturas & Ventas (`/api/facturas`, `/ventas`)

### `POST /api/facturas`
Crea una nueva factura y sus líneas de detalle en PostgreSQL mediante **Drizzle ORM Transaction** con validación DTO Zod y recálculo dinámico de subtotales.

**Payload de Entrada (JSON):**
```json
{
  "cliente_id": 1,
  "total": 75000,
  "forma_pago": "efectivo",
  "productos": [
    {
      "producto_id": 1,
      "cantidad": 5,
      "precio": 15000,
      "unidad": "KG"
    }
  ]
}
```

**Respuesta Exitosa (HTTP 201 Created):**
```json
{
  "message": "Factura creada exitosamente",
  "id": 14,
  "cliente_id": 1,
  "total": 75000,
  "forma_pago": "efectivo",
  "fecha": "2026-08-01T00:00:00.000Z",
  "detalles": [
    {
      "id": 20,
      "factura_id": 14,
      "producto_id": 1,
      "cantidad": "5",
      "precio_unitario": "15000",
      "unidad_medida": "KG",
      "subtotal": 75000
    }
  ]
}
```

### `GET /api/facturas/:id/imprimir`
Obtiene los datos completos de una factura con cliente, líneas de productos y configuración de negocio decodificada para la vista de impresión.

### `GET /api/facturas/:id/detalles`
Obtiene la información detallada de productos y subtotales para la vista de consulta.

### `GET /ventas`
Historial de ventas ordenado por fecha descendente con joins a la tabla de clientes.

---

## 2. Productos (`/api/productos`)

### `GET /api/productos`
Retorna la lista de productos del catálogo ordenados por nombre mediante Drizzle ORM Repository.

### `GET /api/productos/buscar?q=term`
Búsqueda rápida en tiempo real por nombre o código (`ILIKE`).

### `POST /api/productos`
Crea un nuevo producto en el catálogo (Validado con `CreateProductoDTO` Zod).

**Payload:**
```json
{
  "codigo": "FRESA-002",
  "nombre": "Fresas Especiales",
  "precio_kg": 16000,
  "precio_unidad": 0,
  "precio_libra": 8000
}
```

---

## 3. Clientes (`/api/clientes`)

### `GET /api/clientes`
Retorna el directorio de clientes.

### `GET /api/clientes/buscar?q=term`
Búsqueda de clientes por nombre, teléfono o dirección.

### `POST /api/clientes`
Crea un nuevo cliente (Validado con `CreateClienteDTO` Zod).

---

## 4. Configuración (`/api/configuracion`)

### `GET /api/configuracion`
Obtiene la configuración de negocio e impresión (excluyendo binarios `BYTEA`).

### `POST /api/configuracion`
Guarda datos de negocio y procesa imágenes de logo y QR mediante `IStorageService` y almacenamiento binario en PostgreSQL.


### `GET /api/clientes`
Retorna la lista de clientes registrados.

### `POST /api/clientes`
Registra un nuevo cliente.

---

## 4. Configuración (`/api/configuracion`)

### `GET /api/configuracion`
Retorna los ajustes de la empresa y configuración de impresión.

### `POST /api/configuracion`
Actualiza datos de empresa y permite subir imágenes (Logo y QR) procesándolas a binarios `BYTEA`.
