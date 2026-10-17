# Plan Técnico — 017 Reportes en Nuevo Stack

## Diseño

- Módulo `reports` en Fastify.
- RBAC `gerente`/`admin`.
- Agregación SQL.
- Exportación CSV/PDF controlada.
- Paginación.

## Cambios por archivo

| Área | Cambio | Requisito |
| --- | --- | --- |
| `apps/api/modules/reports` | endpoints y agregación | R-001..R-005 |
| tests | integration | R-001..R-005 |

## Decisiones

- ADR-0018: Reportes read-only con agregación persistente.
  1. No mutan datos.
  2. Scope por rol.
  3. Totales SQL.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Exposición datos | RBAC |
| Respuestas masivas | paginación |
| Totales inconsistentes | agregación SQL |