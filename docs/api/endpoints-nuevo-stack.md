# API del Stack Nuevo — `apps/api` (Fastify 5 + Prisma 7)

> **Base URL**: `http://localhost:3001/api/v1`
> **Autenticación**: `Authorization: Bearer <token>` (JWT). Obligatoria en todos los endpoints salvo `POST /auth/login` y los health checks.
> **Idempotencia**: header `Idempotency-Key: <UUID-v4>` en operaciones reintentables (`POST /sales`, `POST /separados`).
> **Errores**: `{ error, code?, detalles?, correlationId? }` con `details` en forma de mapa campo → mensaje.

> Documentación del stack **legacy en producción**: [`../api/endpoints.md`](../api/endpoints.md).

---

## Salud

| Método | Ruta              | Descripción                     | Auth |
| ------ | ----------------- | ------------------------------- | ---- |
| GET    | `/health`         | Estado del servicio              | No   |
| GET    | `/api/v1/health`  | Estado del servicio              | No   |

## Autenticación y usuarios

| Método | Ruta                  | Descripción                                       | Rol           |
| ------ | --------------------- | ------------------------------------------------- | ------------- |
| POST   | `/auth/login`         | Login dual (email o documento) → JWT + sesión BD  | Público       |
| GET    | `/auth/me`            | Actor autenticado                                 | Autenticado   |
| GET    | `/roles`              | Roles canónicos                                   | Autenticado   |
| GET    | `/employees`          | Directorio de empleados                            | gerente/admin |
| GET    | `/employees/:id`      | Detalle de empleado                                | gerente/admin |
| POST   | `/employees`          | Alta de empleado (Argon2id)                        | admin         |
| PATCH  | `/employees/:id`      | Actualización / desactivación (revoca sesiones)   | admin         |

## Catálogo

| Método | Ruta            | Descripción              | Auth         |
| ------ | --------------- | ------------------------ | ------------ |
| GET    | `/products`     | Productos activos        | Autenticado |
| GET    | `/products/:id` | Producto por id          | Autenticado |

## Ventas

| Método | Ruta     | Descripción                                                |
| ------ | -------- | ---------------------------------------------------------- |
| POST   | `/sales` | Crea venta: valida stock, aplica descuentos y descuenta inventario en una transacción. Requiere `Idempotency-Key`. |

Respuesta incluye `sale`, `descuentos.aplicados` y `descuentos.rechazados`.

Errores: `400 TOTAL_MISMATCH`, `404` producto inexistente, `409 INSUFFICIENT_STOCK`, `422 DESCUENTOS_RECHAZADOS`.

## Inventario

| Método | Ruta                          | Descripción                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/inventory/movements`        | Kardex (limite y filtro por producto)     |
| GET    | `/inventory/stock-critical`    | Productos bajo stock mínimo              |
| POST   | `/inventory/movements`        | Movimiento manual (entrada/salida/ajuste) |

## Caja

| Método | Ruta            | Descripción                          |
| ------ | --------------- | ------------------------------------ |
| POST   | `/cash/open`    | Apertura (una sesión abierta por usuario) |
| GET    | `/cash/state`   | Sesión activa del usuario            |
| POST   | `/cash/close`   | Cierre con arqueo y diferencia        |
| GET    | `/cash/active`  | Cajas abiertas (totales en vivo)      |

## Clientes

| Método | Ruta                | Descripción                       |
| ------ | ------------------- | --------------------------------- |
| GET    | `/customers`        | Clientes activos                  |
| GET    | `/customers/:id`    | Cliente por id                    |
| POST   | `/customers`        | Alta (unicidad tipo + documento)  |
| DELETE | `/customers/:id`    | Inactivación lógica (soft delete) |

## Separados

| Método | Ruta                        | Descripción                            |
| ------ | --------------------------- | -------------------------------------- |
| GET    | `/separados`                | Listado                                |
| POST   | `/separados`                | Creación: reserva stock + abono inicial |
| POST   | `/separados/:id/abonos`     | Abono (serializado por separado)        |

## Descuentos

| Método | Ruta              | Descripción                                  |
| ------ | ----------------- | -------------------------------------------- |
| GET    | `/discounts`      | Catálogo de descuentos vigentes             |
| GET    | `/discounts/:id`  | Descuento por id                             |
| POST   | `/discounts`      | Alta de descuento                            |
| PATCH  | `/discounts/:id`  | Actualización                                |

El cálculo vive en `packages/discounts` (motor puro compartido con el web).

## Devoluciones y cambios

| Método | Ruta         | Descripción                                                        |
| ------ | ------------ | ------------------------------------------------------------------ |
| GET    | `/returns`   | Devoluciones registradas                                          |
| POST   | `/returns`   | Devolución o **cambio** de artículo: reingreso, diferencia y factura vinculada |

## Reportes

| Método | Ruta                     | Descripción                          | Rol           |
| ------ | ------------------------ | ------------------------------------ | ------------- |
| GET    | `/reports/sales`         | Ventas + totales agregados (paginados) | gerente/admin |
| GET    | `/reports/sales/csv`     | Exportación CSV                       | gerente/admin |

## Tiempo real (Socket.io)

| Evento             | Cuándo                                     |
| ------------------ | ------------------------------------------ |
| `sale:created`     | Venta registrada                          |
| `stock:updated`    | Movimiento de inventario                  |
| `cash:opened`      | Apertura de caja                           |
| `cash:closed`      | Cierre de caja                             |
| `return:created`   | Devolución o cambio                        |
