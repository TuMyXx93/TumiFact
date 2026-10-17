# Plan Técnico — 013 Vertical Slice Nuevo Stack

## Diseño

- Implementar auth en `apps/api` con Prisma.
- Implementar productos y ventas en Fastify.
- Implementar POS mínimo en React.
- Validar stock y idempotencia.
- E2E Playwright.

## Cambios por archivo

| Área | Cambio | Requisito |
| --- | --- | --- |
| `apps/api/modules/auth` | login JWT | R-001 |
| `apps/api/modules/products` | catálogo | R-002 |
| `apps/api/modules/sales` | venta + stock | R-003 |
| `apps/web/src/features/pos` | POS mínimo | R-001, R-003 |
| `apps/web/src/lib/offline-queue` | offline | R-005 |
| Playwright | E2E | R-006 |

## Decisiones

- ADR-0014: Vertical slice primero.
  1. Validar arquitectura.
  2. No migrar todo.
  3. Rollback por módulo.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Integración incompleta | E2E |
| Doble stack | feature flags |
| Datos sintéticos | seed |