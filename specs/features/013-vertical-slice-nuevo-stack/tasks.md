---
id: 013-vertical-slice-nuevo-stack
version: 0.1.0
status: pending
---

# Tasks — 013 Vertical Slice Nuevo Stack

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0014 de vertical slice | todos | done |
| T-002 | Implementar login en apps/api | R-001 | done |
| T-003 | Implementar catálogo productos en apps/api | R-002 | done |
| T-004 | Implementar venta + stock en apps/api | R-003 | done |
| T-005 | Implementar POS mínimo en apps/web | R-001, R-003, R-004 | done |
| T-006 | Integrar offline queue | R-005 | done |
| T-007 | Añadir E2E Playwright | R-006 | done |
| T-008 | Ejecutar `/analyze`, CI, trazabilidad | todos | pending |

## Notas

- No tocar legacy.
- Validar antes de migrar más módulos.