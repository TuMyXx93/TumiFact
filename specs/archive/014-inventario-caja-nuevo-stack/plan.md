# Plan Técnico — 014 Inventario y Caja en Nuevo Stack

## Diseño

- Módulos `inventory` y `cash` en Fastify.
- Prisma transaccional para stock y movimientos.
- Serialización por producto/caja.
- Socket.io para eventos.
- Validación de sesión activa en ventas.

## Cambios por archivo

| Área | Cambio | Requisito |
| --- | --- | --- |
| `apps/api/modules/inventory` | movimientos y stock crítico | R-001, R-002 |
| `apps/api/modules/cash` | apertura/cierre | R-003, R-004, R-005 |
| `apps/api/modules/sales` | validar sesión abierta | R-005 |
| Socket.io | eventos | R-006 |

## Decisiones

- ADR-0015: Inventario y caja atómicos en Fastify.
  1. Locks por producto/usuario.
  2. Cierre inmutable.
  3. Eventos real-time.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Concurrencia | locks transaccionales |
| Doble cierre | update condicionado |
| Stock negativo | validación |