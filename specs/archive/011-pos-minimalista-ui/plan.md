# Plan Técnico — 011 POS Minimalista UI

## Diseño

- POS en 3 zonas: catálogo, carrito, pago.
- Búsqueda instantánea.
- Pago unificado.
- Ticket térmico.
- Offline queue.
- Accesibilidad y teclado.

## Cambios por archivo

| Área | Cambio | Requisito |
| --- | --- | --- |
| `apps/web/src/features/pos` | nueva UI POS | R-001, R-003, R-004 |
| `apps/web/src/components/ui` | design system | R-007 |
| `apps/web/src/lib/offline-queue` | cola offline | R-005 |
| Playwright | E2E POS | R-004, R-006 |

## Decisiones

- ADR-0012: POS minimalista.
  1. Una acción principal.
  2. Teclado first.
  3. Accesibilidad WCAG.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| UX sobrecargada | pruebas de usabilidad |
| Offline conflicts | idempotencia |
| Performance | virtualización |