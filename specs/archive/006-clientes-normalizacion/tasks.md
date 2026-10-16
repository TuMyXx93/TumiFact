---
id: 006-clientes-normalizacion
version: 0.1.0
status: pending
---

# Tasks — 006 Clientes

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0007 de integridad de clientes | todos | done |
| T-002 | Validar unicidad documental condicionada | R-001 | done |
| T-003 | Evitar eliminación física con relaciones | R-003 | done (soft delete existente) |
| T-004 | Preservar inactivación segura | R-005 | done (soft delete existente) |
| T-005 | Auditar mutaciones de cliente | R-006 | done |
| T-006 | Ejecutar `/analyze`, Biome, Vitest, trazabilidad | todos | done |