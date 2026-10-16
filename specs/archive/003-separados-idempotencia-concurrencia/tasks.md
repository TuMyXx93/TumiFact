---
id: 003-separados-idempotencia-concurrencia
version: 0.1.0
status: pending
---

# Tasks — 003 Separados: Idempotencia, Reserva y Cierre Auditable

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0004 sobre abonos/factura final concurrente | todos | done |
| T-002 | Ajustar creación de separado para respuesta idempotente estable | R-001, R-002 | done |
| T-003 | Serializar abonos por separado | R-003, R-005 | done |
| T-004 | Validar saldo y rechazar abono mayor al saldo | R-008 | done |
| T-005 | Generar factura final una sola vez al completar | R-004, R-005, R-007 | done |
| T-006 | Validar estado activo y sesión de caja | R-006, R-010 | done |
| T-007 | Integrar auditoría crítica en transacción | R-007 | done |
| T-008 | Ejecutar pruebas existentes y estabilizar cambios | R-001, R-003, R-005, R-008 | done |
| T-009 | Ejecutar `/analyze`, Biome, Vitest, actualizar trazabilidad | todos | done |

## Notas

- Implementar por tarea con contexto mínimo.
- No mezclar frontend en este ciclo.