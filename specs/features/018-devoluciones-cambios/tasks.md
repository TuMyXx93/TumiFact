---
id: 018-devoluciones-cambios
version: 0.1.0
status: pending
---

# Tasks — 018 Devoluciones y Cambios en Nuevo Stack

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0019 de devoluciones/cambios | todos | done |
| T-002 | Implementar módulo returns en Fastify | R-001..R-005 | done |
| T-003 | Implementar reingreso de stock del producto devuelto | R-001, R-004 | done |
| T-004 | Implementar descuento de stock del producto nuevo (cambio) | R-002, R-004 | done |
| T-005 | Calcular diferencia a pagar/a favor | R-003 | done |
| T-006 | Generar factura/nota de cambio vinculada | R-005 | done |
| T-007 | Serializar por producto y validar idempotencia | R-002, R-006 | done |
| T-008 | Auditar y emitir evento Socket.io | R-007 | done |
| T-009 | Añadir tests integration + concurrency | R-001..R-007 | done |
| T-010 | Ejecutar `/analyze`, CI, trazabilidad | todos | done |

## Notas

- No tocar legacy.
- Reutilizar `recordAudit` y `emitEvent` existentes.
- El cambio debe quedar registrado como operación trazable, no como edición silenciosa.