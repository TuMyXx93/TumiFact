# Plan Técnico — 010 Dominio: Unidades, Presentaciones y Variantes

## Diseño

- Catálogo de unidades controlado.
- Presentaciones con factor de conversión.
- Variantes por SKU.
- Atributos validados por categoría.
- Historial de precios.

## Cambios por archivo

| Área | Cambio | Requisito |
| --- | --- | --- |
| `packages/schemas` | unidades, presentaciones, variantes | R-001, R-004 |
| `apps/api/modules/products` | lógica de variantes | R-002 |
| `apps/api/modules/sales` | conversión de presentación | R-003 |
| `apps/api/modules/products` | auditoría de precios | R-005 |

## Decisiones

- ADR-0011: Unidades normalizadas y variantes.
  1. Unidad base + factor.
  2. Variantes opcionales.
  3. Atributos validados.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Conversión incorrecta | tests unitarios |
| Atributos inconsistentes | schema Zod |
| Complejidad catálogo | feature flags |