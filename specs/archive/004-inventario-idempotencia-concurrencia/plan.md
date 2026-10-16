# Plan Técnico — 004 Inventario

## Diseño

Se refuerza el módulo de inventario:

1. Idempotencia robusta para movimientos y ajustes.
2. Movimiento de salida no permite stock negativo; debe fallar con 409.
3. Serialización por producto para evitar lost update.
4. Stock y Kardex se escriben en la misma transacción.
5. Auditoría crítica transaccional.
6. Stock crítico validable por repositorio.

## Cambios por archivo

| Archivo | Cambio | Requisito |
| --- | --- | --- |
| `src/modules/inventario/inventario.service.ts` | idempotencia en transacción; validación de salida; lock por producto; auditoría en transaction | R-001..R-007 |
| `src/modules/inventario/inventario.repository.ts` | reporte stock crítico; helpers de consulta por idempotency | R-008 |
| `src/shared/utils/audit.ts` | reutilizar helper transactional | R-007 |
| `packages/schemas/src/inventario.ts` | validar `nuevo_stock >= 0` y motivo no vacío | R-006 |
| `tests/inventario.test.ts` | cubrir idempotencia, salida, lost update, rollback | R-001..R-007 |

## Decisiones tomadas

- ADR nuevo propuesto: `0005-inventario-serializado-y-kardex.md`
  1. Lock advisory por producto.
  2. Salida sin stock suficiente falla.
  3. Ajuste quick rechaza `nuevo_stock < 0`.
  4. Auditoría transaccional para toda mutación.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Lost update | lock por producto |
| Stock negativo | predicado y validación |
| Doble movimiento por retry | unique idempotency key |
| Auditoría fallida | rollback |