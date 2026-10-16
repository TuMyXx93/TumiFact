# Plan Técnico — 007 Productos

## Diseño

Se endurece el catálogo:

1. Unicidad de código ya existe; se documenta y preserva.
2. Eliminación lógica para productos con relaciones.
3. Validación de precios no negativos en schema.
4. Auditoría transaccional de cambios.
5. Sincronización prudente con inventario.

## Cambios por archivo

| Archivo | Cambio | Requisito |
| --- | --- | --- |
| `src/modules/productos/productos.service.ts` | evitar update ciego de stock; auditoría tx | R-002, R-005 |
| `src/modules/productos/productos.repository.ts` | soft delete y no borrar físicamente | R-003 |
| `packages/schemas/src/productos.ts` | validaciones de precios | R-004 |
| `tests/productos.test.ts` | cobertura | R-001..R-005 |

## Decisiones

- ADR-0008: Catálogo no destructivo.
  1. No delete físico con relaciones.
  2. Precios validados.
  3. Stock no se sobrescribe ciegamente si hay movimientos recientes.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Inconsistencia stock | integrar inventario |
| Eliminación histórica | soft delete |
| Precios inválidos | schema |