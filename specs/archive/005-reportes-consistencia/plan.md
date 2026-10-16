# Plan Técnico — 005 Reportes

## Diseño

Se endurece la capa de reportes como read-only, con RBAC y scope:

1. Reportes de ventas aplican scope de operador automáticamente.
2. Totales se calculan con SQL agregado o parseo consistente, evitando duplicar lógica.
3. Exportaciones CSV/PDF retornan error controlado si fallan.
4. Inventario exportado calcula estado con datos persistidos.
5. Sesiones activas reutilizan agregación existente.

## Cambios por archivo

| Archivo | Cambio | Requisito |
| --- | --- | --- |
| `src/modules/reportes/reportes.controller.ts` | aplicar RBAC y scope | R-001, R-002 |
| `src/modules/reportes/reportes.service.ts` | totales consistentes, paginación/límite | R-003, R-005, R-006, R-007 |
| `src/modules/reportes/reportes.ts` / routes | exportar CSV/PDF con error controlado | R-004 |
| `tests/reportes.test.ts` | cubrir scope RBAC, totales, exportación | R-001..R-007 |

## Decisiones

- ADR-0006: Reportes read-only con agregación persistente.
  1. No mutan datos.
  2. Scope por usuario automático para operadores.
  3. Totales calculados en SQL o parseo consistente.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Exposición de datos | RBAC + scope |
| Respuestas masivas | límite/paginación |
| Totales inconsistentes | agregación SQL |
| Exportación incompleta | try/catch y error controlado |