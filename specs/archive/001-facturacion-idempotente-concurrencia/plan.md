# Plan Técnico — 001 Facturación Idempotente y Consistente bajo Concurrencia

## Diseño

Se conserva la arquitectura actual del módulo `facturas`, pero se blinda el flujo crítico:

1. La idempotencia se resuelve **dentro** de la transacción de creación.
2. La colisión de clave (`PostgreSQL 23505`) se convierte en respuesta idempotente, no en error 500.
3. El flujo remains `service → repository`; el servicio calcula montos, el repositorio ejecuta transacción.
4. Se introduce un resultado explícito de replay (`idempotent: true`) y se evita audit/log duplicados.
5. Se mantiene compatibilidad con el middleware actual y con el schema actual (`idempotency_key` unique).
6. La auditoría crítica se modela como parte de la transacción o mediante una escritura ordenada posterior solo si el commit tuvo éxito (diseño recomendado: insertar auditoría dentro de la transacción para satisfacer R-005/R-008).

## Cambios por archivo

| Archivo | Cambio | Requisito |
| --- | --- | --- |
| `src/modules/facturas/facturas.service.ts` | mover el check idempotente a resultado de repositorio; manejar `IDEMPOTENCY_CONFLICT` como replay con respuesta estable; solo calcular montos antes de llamar al repo | R-001, R-002, R-004, R-007 |
| `src/modules/facturas/facturas.repository.ts` | verificar clave dentro de transacción; insertar factura, validar colisión `23505`; convertir en `IdempotencyConflictError`; escribir movimientos, cliente y auditoría dentro de tx; no dejar efectos parciales | R-001, R-002, R-003, R-005, R-008 |
| `src/shared/utils/audit.ts` | permitir escritura dentro de transacción (parámetro tx/opcional) **o** añadir helper transaccional; conservar fire-and-forget para acciones no críticas | R-005, R-008 |
| `src/shared/middleware/idempotency.ts` | validar UUID; si no UUID, generar clave y (opcional) marcar procedencia; no aceptar silenciosamente claves inválidas | R-006 |
| `packages/schemas/src/facturas.ts` | documentar `idempotency_key` optional UUID; no cambiar validación, eventualmente aceptar procedencia si se decide | R-006 |
| `src/db/schema/facturas.ts` | confirmar `unique()` y añadir índice si falta; ninguna migración destructiva | R-002 |
| `tests/facturas.test.ts` | añadir escenarios R-001..R-008, incluyendo concurrencia simulada y rollback | R-001..R-008 |
| `specs/features/.../tasks.md` | desglose atómico | todos |

## Contratos de UI/API

### POST `/api/facturas`

- Header opcional: `Idempotency-Key: UUID`
- Body según `CreateFacturaDTO`.
- `201` creación nueva:
  - `{ message, id, total, ... }`
- `200` replay idempotente:
  - `{ idempotent: true, message, id, ... }`
- `409 INSUFFICIENT_STOCK`
  - no factura, no stock decrementado
- `400` por total manipulado

### Servicio/Repositorio

- `createFactura(input, userId?, sesionCajaId?, req?)`
  - debe delegar el manejo de conflicto al repository y diferenciar replay de creación.
- `createWithDetails(facturaData, items)`:
  - returns `{ factura, detalles, idempotent: boolean }` o throws `IdempotencyConflictError` con la clave.
- `findByIdWithDetails(id)` unchanged for replay hydration.

## Decisiones tomadas

- **ADR nuevo propuesto: `0002-facturacion-idempotencia-transaccional.md`**:
  1. Única autoridad de unicidad: `facturas.idempotency_key` unique constraint.
  2. Retry handling: catch DB `23505` y convertir a replay.
  3. Acciones críticas (movimientos, cliente, audit) se escriben en la misma transacción para cumplir rollback.
  4. No introducir lock distribuido en Redis en este piloto; la BD sigue siendo autoridad.

## Riesgos y mitigación

| Riesgo | Mitigación |
| --- | --- |
| Race real entre dos requests con misma clave | unique constraint + catch `23505`; replay hidratando factura existente |
| Replay parcial por lectura concurrente | retry/backoff mínimo en el service si `findById` falla; devolver error controlado en lugar de 500 |
| Audit async fuera de transacción | hacer auditoría transaccional o al menos posterior a commit confirmado; registrar fallo sin romper respuesta |
| Concurrencia en stock | mantener predicado `stock_actual >= cantidad`; error 409 |
| Precisión monetaria | mantener redondeo a 2 decimales y validación > 0.05 |
| Regresión en API consumidores | mantener campos y estados HTTP documentados |

## Condición para implementación

No se modifica código hasta tener spec aprobada y este plan revisado. Con esto listo, `/tasks` puede descomponer la feature en tareas atómicas y luego `/implement` actuará por tarea con contexto mínimo.