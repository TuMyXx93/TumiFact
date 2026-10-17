# Plan Técnico — 015 Clientes en Nuevo Stack

## Diseño

- Módulo `customers` en Fastify.
- Validación de duplicados por tipo + número.
- Soft delete.
- Búsqueda paginada.
- Auditoría transaccional.

## Cambios por archivo

| Área | Cambio | Requisito |
| --- | --- | --- |
| `apps/api/modules/customers` | CRUD y búsqueda | R-001..R-004 |
| `packages/schemas` | DTOs clientes | R-001 |
| `apps/api` audit | auditoría | R-005 |
| tests | integration | R-001..R-005 |

## Decisiones

- ADR-0016: Clientes no destructivos en nuevo stack.
  1. Soft delete.
  2. Unicidad condicionada.
  3. Auditoría.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Duplicados | constraint |
| Pérdida histórica | soft delete |
| Búsqueda masiva | paginación |