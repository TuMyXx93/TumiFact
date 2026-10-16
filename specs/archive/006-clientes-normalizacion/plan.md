# Plan Técnico — 006 Clientes

## Diseño

- Validar unicidad documental cuando ambos campos estén presentes.
- Evitar eliminación física si existen facturas o separados.
- Preservar relaciones y datos históricos.
- Auditar creación, actualización e inactivación.

## Cambios por archivo

| Archivo | Cambio | Requisito |
| --- | --- | --- |
| `src/modules/clientes/clientes.service.ts` | validaciones e integridad | R-001..R-006 |
| `src/modules/clientes/clientes.repository.ts` | constraints y delete lógico | R-001, R-003 |
| `packages/schemas/src/clientes.ts` | validaciones de entrada | R-001 |
| `tests/clientes.test.ts` | cobertura | R-001..R-006 |

## Decisiones

- ADR-0007: Clientes no destructivos.
  1. No delete físico con relaciones.
  2. Inactivación preferible.
  3. Unicidad condicionada.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Duplicados | constraint condicionado |
| Pérdida histórica | delete lógico |
| RBAC | rutas protegidas |