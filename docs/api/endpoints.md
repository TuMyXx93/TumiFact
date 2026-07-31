# Especificación de API REST — TumiFact 🔌

## 1. Facturas (`/api/facturas`)

### `POST /api/facturas`
Crea una nueva factura y sus líneas de detalle en PostgreSQL con recálculo dinámico de subtotales.

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
  "id": 14
}
```

---

## 2. Productos (`/api/productos`)

### `GET /api/productos`
Retorna la lista de productos del catálogo.

### `GET /api/productos/buscar?q=term`
Búsqueda rápida en tiempo real por nombre o código (`ILIKE`).

### `POST /api/productos`
Crea un nuevo producto en el catálogo.

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
Retorna la lista de clientes registrados.

### `POST /api/clientes`
Registra un nuevo cliente.

---

## 4. Configuración (`/api/configuracion`)

### `GET /api/configuracion`
Retorna los ajustes de la empresa y configuración de impresión.

### `POST /api/configuracion`
Actualiza datos de empresa y permite subir imágenes (Logo y QR) procesándolas a binarios `BYTEA`.
