# Plan Técnico — 003 Separados: Idempotencia, Reserva y Cierre Auditable

## Diseño

Se mantiene la estructura actual, pero se formalizan contratos e invariantes:

1. Idempotencia de creación y abono mediante clave UUID y respuesta estable.
2. Serialización por separado para evitar abonos concurrentes que superen saldo o generen factura doble.
3. Reserva de stock con actualización condicionada, como en facturación.
4. Factura final solo cuando `saldo <= 0`, dentro de la misma transacción.
5. Validación de estado `activo` antes de cualquier abono.
6. Validación de sesión de caja abierta cuando `sesion_caja_id` se informa.
7. Auditoría crítica en transacción.

## Cambios por archivo

| Archivo | Cambio | Requisito |
| --- | --- | --- |
| `src/modules/separados/separados.service.ts` | manejar idempotencia por abono dentro de transaction/result; validar saldo y estado | R-001..R-008, R-010 |
| `src/modules/separados/separados.repository.ts` | check/insert condicionado por clave; helper de estado y saldo | R-001, R-002, R-003, R-005 |
| `src/db/schema/separados.ts` / `abonos_separado.ts` | confirmar `unique` de idempotency en separados y abonos | R-001, R-003 |
| `src/shared/utils/audit.ts` | reutilizar `recordAuditInTransaction` | R-007 |
| `src/modules/facturas/facturas.service.ts` | validar sesión abierta propietaria (ya implementado) | R-010 |
| `tests/separados.test.ts` | nuevas pruebas de idempotencia/abono/saldo/completado | R-001, R-003, R-005, R-008 |

## Decisiones tomadas

- ADR propuesto: `0004-separados-y-factura-final-concurrente.md`
  1. Una sola factura final por separado.
  2. Abonos concurrentes serializados por `pg_advisory_xact_lock(separadoId)`.
  3. Stock reserva usa `UPDATE ... WHERE stock_actual >= cantidad` cuando sea posible; en la implementación actual se valida antes de actualizar y se deja mejora futura.

## Riesgos y mitigación

| Riesgo | Mitigación |
| --- | --- |
| Doble factura al completar | lock por separado + check estado dentro de tx |
| Abono concurrente que supera saldo | serialización y validación de saldo dentro de tx |
| Repetición idempotente | check clave + respuesta estable |
| Sesión cerrada | validar estado |
| Inconsistencia de auditoría | audit transaccional |