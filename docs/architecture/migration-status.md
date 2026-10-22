# Estado de la Migración — TumiFact POS

> Documento vivo. Fuente de verdad del estado de la migración del stack legacy
> (Astro + Express + Drizzle) al nuevo stack (Fastify + Prisma + React/Vite).

## Estrategia

**Strangler pattern**, sin big-bang:

- El legacy sigue siendo la producción hasta el cutover.
- Cada módulo se migra y se valida en el nuevo stack antes de activarlo.
- Rollback por módulo: el legacy permanece intacto hasta el cierre de la fase.

## Estado por módulo (nuevo stack `apps/`)

| Módulo       | Legacy (`src/modules/`) | Nuevo (`apps/api/src/modules/`) | Estado                              |
| ------------ | ------------------------ | ------------------------------- | ----------------------------------- |
| Auth         | `auth`                   | `auth`                          | ✅ Migrado (identidad real, sesión revocable) |
| Productos    | `productos`              | `products`                      | ✅ Migrado                            |
| Ventas       | `facturas` + `ventas`    | `sales`                         | ✅ Migrado (idempotencia + stock atómico) |
| Inventario   | `inventario`             | `inventory`                     | ✅ Migrado (Kardex + stock crítico)  |
| Caja         | `caja`                   | `cash`                          | ✅ Migrado (apertura/cierre)         |
| Clientes     | `clientes`               | `customers`                     | ✅ Migrado (soft delete + unicidad)   |
| Separados    | `separados`              | `separados`                     | ✅ Migrado (abonos + factura final)  |
| Reportes     | `reportes`               | `reports`                       | ✅ Migrado (RBAC + agregación SQL)   |
| Devoluciones | `devoluciones`           | `returns`                       | ✅ Migrado (devoluciones + cambios)  |
| Empleados    | `empleados`              | `employees`                     | ✅ Migrado (CRUD + revocación)       |
| Descuentos   | `descuentos`             | `discounts`                     | ✅ Migrado (motor puro compartido)   |
| Categorías   | `categorias`             | —                               | ⏳ Pendiente                          |
| Proveedores  | `proveedores`            | —                               | ⏳ Pendiente                          |
| Configuración| `configuracion`          | —                               | ⏳ Pendiente                          |
| Impresión    | `src/pages/.../imprimir` | —                               | ⏳ Pendiente                          |
| DIAN         | —                        | —                               | ⏳ Especificado (spec 012)           |

## Fundaciones ya resueltas

| Área                | Implementación                                                        |
| ------------------- | --------------------------------------------------------------------- |
| Identidad           | `apps/api/src/lib/auth.ts` — actor real, sesión en BD, revocación, `jti` único |
| RBAC                | `apps/api/src/lib/permissions.ts` — permisos granulares + bypass de admin |
| Migraciones de BD   | `apps/api/prisma/migrations/` — baseline + constraints, historial unificado |
| Seeds               | `apps/api/prisma/seed.ts` — roles canónicos, usuarios, descuentos      |
| Motor de descuentos | `packages/discounts` — puro, determinista, compartido web/API         |
| Tiempo real         | `apps/api/src/lib/socket.ts` — eventos de venta, stock, caja, devolución |
| Auditoría           | `apps/api/src/lib/audit.ts` — registro best-effort sin romper la operación |
| Colas offline       | `apps/web/src/lib/offlineQueue.ts` — reintento con `Idempotency-Key`   |
| Design system       | `apps/web/src/components/ui/` — Button, Card, Badge, SearchInput        |
| CI                  | Job dedicado "New Stack API (Fastify + Prisma)" con base propia        |

## Bases de datos

| Base                  | Stack   | Dueño del esquema                | Uso                                  |
| --------------------- | ------- | --------------------------------- | ------------------------------------ |
| `tumifact_db`         | Ambos   | Drizzle (legacy) + 1 corrección   | Desarrollo y producción              |
| `tumifact_test`       | Legacy  | Drizzle baseline                   | Suite legacy (`pnpm test`)           |
| `tumifact_test_api`   | Nuevo   | Prisma migrations                  | Suite del nuevo stack                |

> Las dos suites son **independientes**: bases separadas, sin truncates cruzados.

## Invariantes que no se rompen

- `usuario_id` **nunca** es un valor fijo (gate de CI en `apps/api`).
- Toda mutación financiera es transaccional y auditable.
- Toda operación reintentable lleva `Idempotency-Key`.
- El total que ve el cajero lo calcula el **mismo motor** que cobra el backend.
- El `CHECK` de medios de pago admite efectivo, tarjeta, transferencia y mixto.

## Especificaciones

| Spec  | Tema                          | Estado |
| ----- | ----------------------------- | ------ |
| 001   | Facturación idempotente        | ✅     |
| 002   | Caja                           | ✅     |
| 003   | Clientes                       | ✅     |
| 004   | Configuración                  | ✅     |
| 005   | Reportes                       | ✅     |
| 006   | Clientes (nuevo stack)         | ✅     |
| 007   | Productos                      | ✅     |
| 008   | Configuración (nuevo stack)    | ✅     |
| 009   | Migración monorepo             | ✅     |
| 010   | Unidades y variantes           | ✅     |
| 011   | POS minimalista                | ✅     |
| 012   | DIAN readiness                 | ✅     |
| 013   | Vertical slice nuevo stack     | ✅     |
| 014   | Inventario y caja (nuevo)      | ✅     |
| 015   | Clientes (nuevo)               | ✅     |
| 016   | Separados (nuevo)              | ✅     |
| 017   | Reportes (nuevo)               | ✅     |
| 018   | Devoluciones y cambios         | ✅     |
| 019   | Empleados, roles e identidad   | ✅     |
| 020   | Motor de descuentos            | ✅     |

Detalle completo en `specs/`.
