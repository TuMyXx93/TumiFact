---
id: 019-empleados-roles-identidad
version: 0.1.0
status: pending
---

# Tasks — 019 Empleados, Roles e Identidad Real

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0020 de identidad real | todos | pending |
| T-002 | Implementar `getActor`/`requireActor` y verificar sesión activa | R-002, R-004, R-006 | pending |
| T-003 | Endurecer login: activo, bloqueo, rol y sesión | R-002, R-003 | pending |
| T-004 | Implementar módulo employees (CRUD + roles) | R-001, R-005, R-007 | pending |
| T-005 | Eliminar hardcodes `usuario_id: 1` en sales | R-004 | pending |
| T-006 | Eliminar hardcodes en inventory y cash | R-004 | pending |
| T-007 | Eliminar hardcodes en separados y returns | R-004 | pending |
| T-008 | Eliminar hardcodes en customers y auditoría | R-004 | pending |
| T-009 | Revocar sesiones al desactivar empleado | R-006 | pending |
| T-010 | Registrar intento de acceso denegado (403) | R-008 | pending |
| T-011 | Añadir tests de identidad, roles y actor real | R-001..R-008 | pending |
| T-012 | Ejecutar `/analyze`, CI, trazabilidad | todos | pending |

## Notas

- T-005 a T-008 deben dejar el repo **sin** `usuario_id: 1` hardcodeado.
- Verificar con: `grep -rn "usuario_id: 1" apps/api/src | grep -v /test/` → vacío.
- DTOs de salida explícitos: nunca devolver `password_hash`.