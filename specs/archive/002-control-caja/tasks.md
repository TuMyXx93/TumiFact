---
id: 002-control-caja
version: 0.1.0
status: pending
---

# Tasks — 002 Control de Caja

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0003 de inmutabilidad y una sesión activa | todos | done |
| T-002 | Proteger apertura contra sesiones duplicadas en concurrencia | R-001, R-002, R-006 | done |
| T-003 | Normalizar cálculos monetarios y congelar totales al cerrar | R-003, R-004 | done |
| T-004 | Hacer cierre no repetible y marcar sesión inmutable | R-004, R-005 | done |
| T-005 | Validar estado abierto de sesión antes de registrar facturas | R-005 | done |
| T-006 | Mantener permisos existentes (owner close, gerente/admin reportes) | R-008, R-009 | done |
| T-007 | Integrar auditoría de apertura transaccional; cierre registra auditoría | R-007 | done |
| T-008 | Mantener reporte de sesiones activas | R-009 | done |
| T-009 | Añadir tests de concurrencia apertura/cierre | R-001..R-009 | done |
| T-010 | Ejecutar `/analyze`, Biome, Vitest, actualizar trazabilidad | todos | done |

## Notas

- No implementar antes de aprobación humana del plan.
- Auditoría transaccional reutiliza helper creado en 001.
- No mezclar frontend en este ciclo; solo contratos backend/API.