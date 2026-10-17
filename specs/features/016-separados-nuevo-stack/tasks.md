---
id: 016-separados-nuevo-stack
version: 0.1.0
status: pending
---

# Tasks — 016 Separados en Nuevo Stack

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0017 | todos | done |
| T-002 | Implementar separados en Fastify | R-001..R-005 | done |
| T-003 | Serializar abonos por separado | R-003 | done |
| T-004 | Validar saldo y estado | R-004 | done |
| T-005 | Generar factura final única | R-002, R-005 | done |
| T-006 | Auditar mutaciones | R-005 | pending |
| T-007 | Añadir tests integration/concurrency | R-001..R-005 | pending |
| T-008 | Ejecutar `/analyze`, CI, trazabilidad | todos | pending |

## Notas

- No tocar legacy.
- Implementar por tarea.