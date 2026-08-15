# Especificación de API REST v2 — TumiFact 🔌

> **Base URL**: `http://localhost:3000/api`  
> **Autenticación**: Bearer Token JWT en header `Authorization: Bearer <token>` o cookie `tumifact_token`.  
> **Idempotencia**: Header opcional/requerido `Idempotency-Key: <UUID-v4>` en transacciones críticas.

---

## 1. Autenticación & Control de Acceso (`/api/auth`)

### `POST /api/auth/login`
Autenticación dual con correo electrónico o documento de identidad (cédula/NIT) y validación de hash `Argon2id`.

**Payload de Entrada (JSON):**
```json
{
  "credential": "admin@tumifact.com",
  "password": "Password*2026"
}
```

**Respuesta Exitosa (HTTP 200 OK):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Administrador",
    "email": "admin@tumifact.com",
    "rol": "admin",
    "permisos": { "admin": true, "ventas": true, "caja": true, "inventario": true }
  }
}
```

### `POST /api/auth/logout`
Cierra la sesión activa y elimina la cookie de autenticación.

### `GET /api/auth/me`
Retorna la información del usuario autenticado actual.

---

## 2. Facturación POS (`/api/facturas`)

### `POST /api/facturas`
Crea una nueva factura en PostgreSQL mediante transacción atómica, validación DTO Zod, recálculo dinámico de subtotales, actualización de stock y emisión de eventos Socket.io.

**Headers:**
- `Idempotency-Key`: `550e8400-e29b-41d4-a716-446655440000` (UUID v4)

**Payload de Entrada (JSON):**
```json
{
  "cliente_id": 1,
  "sesion_caja_id": 1,
  "forma_pago": "efectivo",
  "descuento_total": 0,
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
  "fecha": "2026-08-14T10:00:00.000Z",
  "detalles": [
    {
      "id": 20,
      "factura_id": 14,
      "producto_id": 1,
      "cantidad": 5,
      "precio_unitario": 15000,
      "unidad_medida": "KG",
      "subtotal": 75000
    }
  ]
}
```

### `GET /api/facturas/:id/imprimir`
Obtiene los datos completos de una factura con cliente, líneas y configuración de negocio decodificada (`BYTEA` a Base64) para vista térmica (80mm/58mm).

---

## 3. Control de Caja & Turnos (`/api/caja`)

### `GET /api/caja/estado`
Obtiene el estado de la sesión de caja del empleado en turno (abierta/cerrada, total ventas, ventas por medio de pago).

### `POST /api/caja/abrir`
Abre un nuevo turno de caja con base inicial en efectivo (`monto_apertura`).

### `POST /api/caja/cerrar`
Cierra la sesión de caja activa registrando el arqueo en efectivo declarado (`monto_cierre_declarado`) y calculando automáticamente el descuadre/diferencia.

---

## 4. Plan Separador / Layaway (`/api/separados`)

### `GET /api/separados`
Lista de contratos de separados con filtros por estado (`activo`, `liquidado`, `vencido`, `cancelado`).

### `POST /api/separados`
Registra un nuevo plan de separado con reserva de inventario, abono inicial y fecha límite calculada.

### `POST /api/separados/:id/abonos`
Registra un pago parcial a un separado, actualiza el saldo pendiente y emite comprobante.

---

## 5. Control de Inventario & Kardex (`/api/inventario`)

### `GET /api/inventario/movimientos`
Historial cronológico de movimientos de stock con tipo (`entrada`, `salida_venta`, `ajuste_positivo`, `ajuste_negativo`, `devolucion`).

### `POST /api/inventario/ajuste`
Registra un ajuste manual de existencias con justificación y usuario responsable.

---

## 6. Catálogo & Productos (`/api/productos`)

### `GET /api/productos`
Listado de productos con información de categorías, stock actual y precios por escala (KG, Libra, Unidad, Detal, Mayorista).

### `GET /api/productos/buscar?q=term`
Búsqueda instantánea con `ILIKE` por código de barras o nombre de producto.

---

## 7. Reportes & Exportación (`/api/reportes`)

### `GET /api/reportes/ventas?formato=pdf&desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
Genera y descarga reporte de ventas en documento PDF o archivo CSV.

### `GET /api/reportes/inventario?formato=csv`
Exporta el estado y valorización del inventario en formato CSV.

---

## 8. Gestión de Colaboradores & Empleados (`/api/empleados`)

### `GET /api/empleados`
Directorio de colaboradores del negocio con roles, cargo, salario, turno y estado (requiere rol `admin` o `gerente`).

### `GET /api/empleados/metricas`
Métricas y KPIs consolidados de rendimiento de colaboradores en tiempo real (total ventas por colaborador, tickets generados, turnos completados y diferencias de arqueo acumuladas).

### `GET /api/empleados/auditoria`
Historial cronológico e inmutable de logs de auditoría (`audit_log`) con filtro opcional por `usuario_id` (requiere rol `admin`).

### `GET /api/empleados/:id`
Detalle de un colaborador específico por su ID.

### `POST /api/empleados`
Registra un nuevo colaborador con credenciales cifradas con `Argon2id` (requiere rol `admin`).

**Payload de Entrada (JSON):**
```json
{
  "nombre": "Camilo",
  "apellido": "Gordin",
  "tipo_identificacion_id": 1,
  "numero_identificacion": "10000004",
  "email": "gordin@tumifact.com",
  "telefono": "3128563214",
  "password": "Password*2026",
  "rol_id": 3,
  "cargo": "Vendedor/Cajero",
  "departamento": "Caja",
  "salario": 1600000,
  "turno": "completo",
  "descuento_max_porcentaje": 10,
  "descuento_max_monto": 50000
}
```

### `PUT /api/empleados/:id`
Actualiza la información de un colaborador (nombre, apellido, email, rol, cargo, salario, turno, contraseña opcional, descuentos máximos autorizados).

### `PATCH /api/empleados/:id/toggle-status`
Activa o desactiva el acceso de un colaborador al sistema.

### `DELETE /api/empleados/:id`
Elimina la cuenta y perfil de un colaborador (protegido contra auto-eliminación).

---

## 9. Supervisión en Tiempo Real (`/api/auth/empleados-estado`)

### `GET /api/auth/empleados-estado`
Monitoreo en vivo de todos los empleados del sistema, indicando si tienen sesión activa, turno de caja iniciado, hora de apertura de turno, total facturado en la sesión y conteo de ventas en vivo (requiere rol `admin` o `gerente`).

---

## 10. Eventos en Tiempo Real (Socket.io) 📡

El servidor emite eventos en tiempo real en el namespace principal para sincronización instantánea entre terminales y dashboards:

| Evento | Payload / Descripción |
| :--- | :--- |
| `pos:nueva_venta` | Notifica una nueva venta completada con total, cajero y líneas para actualización de métricas |
| `caja:apertura` | Notifica la apertura de un turno de caja por un empleado |
| `caja:cierre` | Notifica el cierre de un turno de caja con arqueo y descuadre |
| `caja:movimiento` | Notifica entradas o salidas de efectivo manuales |
| `empleado:actualizado` | Notifica creación, edición o cambio de estado de un empleado |
| `stock:actualizado` | Notifica cambios en existencias tras venta o ajuste manual |

