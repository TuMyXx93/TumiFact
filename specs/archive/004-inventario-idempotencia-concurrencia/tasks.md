---
id: 004-inventario-idempotencia-concurrencia
version: 0.1.0
status: pending
---

# Tasks — 004 Inventario

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0005 de inventario serializado/Kardex | todos | done |
| T-002 | Hacer idempotencia robusta por movimiento | R-001, R-002 | done |
| T-003 | Rechazar salidas que excedan stock | R-003 | done |
| T-004 | Serializar movimientos por producto | R-005 | done |
| T-005 | Mover auditoría a transacción | R-007 | done |
| T-006 | Validar ajuste rápido (`nuevo_stock >= 0`, motivo) | R-006 | done |
| T-007 | Confirmar Kardex/stock atómicos | R-004 | done |
| T-008 | Confirmar reporte stock crítico | R-008 | done |
| T-009 | Ejecutar pruebas existentes y estabilizar cambios | R-001..R-007 | done |
| T-010 | Ejecutar `/analyze`, Biome, Vitest, trazabilidad | todos | done |

## Notas

- No implementar antes de aprobación explícita del plan.
- No mezclar frontend.