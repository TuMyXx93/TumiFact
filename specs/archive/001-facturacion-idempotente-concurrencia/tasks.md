---
id: 001-facturacion-idempotente-concurrencia
version: 0.1.0
status: pending
---

# Tasks — 001 Facturación Idempotente y Consistente bajo Concurrencia

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0002 con decisión de idempotencia transaccional | todos | done |
| T-002 | Actualizar `src/modules/facturas/facturas.repository.ts` para verificar clave dentro de la transacción | R-001, R-002 | done |
| T-003 | Capturar violación `23505` y exponer `IdempotencyConflictError` tipado | R-002, R-007 | done |
| T-004 | Hacer que `createWithDetails` retorne conflicto controlado | R-001, R-002 | done |
| T-005 | Mover auditoría crítica a escritura dentro de transacción o helper transaccional seguro | R-005, R-008 | done |
| T-006 | Ajustar `FacturasService.createFactura` para manejar replay y no auditar duplicados | R-001, R-004, R-007 | done |
| T-007 | Normalizar respuesta estable en replay (`idempotent`, totales, detalles) | R-001, R-007 | done |
| T-008 | Actualizar middleware `ensureIdempotencyKey` para validar/procedencia de UUID | R-006 | done |
| T-009 | Confirmar constraint único de `idempotency_key` | R-002 | done |
| T-010 | Añadir tests de idempotencia/concurrencia simulada | R-001, R-002, R-003, R-008 | done |
| T-011 | Añadir tests de replay/precisión/clave generada | R-004, R-005, R-006, R-008 | done |
| T-012 | Ejecutar `/analyze`, Biome, Vitest, actualizar trazabilidad | todos | done |

## Notas

- Cada tarea debe ejecutarse con contexto mínimo: spec + plan + una tarea.
- T-002/T-003/T-004 son secuenciales; T-008 y T-009 pueden ir en paralelo.
- Ninguna tarea debe mezclar backend y frontend.