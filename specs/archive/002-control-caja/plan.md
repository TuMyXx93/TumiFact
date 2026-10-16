# Plan Técnico — 002 Control de Caja

## Diseño

Se mantiene la estructura `CajaService → CajaRepository`, pero se blinda:

1. Apertura atómica por usuario: se verifica ausencia de sesión abierta y se crea dentro de una transacción o mediante condición de inserción.
2. Cálculo de totales y diferencia con precisión de 2 decimales y fotografía congelada al cerrar.
3. Cierre idempotente a nivel de usuario/sesión: si alguien intenta cerrar dos veces, la segunda encuentra sesión cerrada y falla.
4. Inmutabilidad post-cierre: `update` con estado `cerrada` no recalcula ni permite asociaciones; facturación valida sesión activa.
5. Auditoría crítica `CAJA_ABIERTA`/`CAJA_CERRADA` se integra en la transacción o se ejecuta solo tras commit confirmado.
6. RBAC se valida en controller/service antes de tocar la BD.

## Cambios por archivo

| Archivo | Cambio | Requisito |
| --- | --- | --- |
| `src/modules/caja/caja.service.ts` | envolver apertura en transacción; cálculo y congelación de totales; normalización monetaria; validación estado | R-001, R-002, R-003, R-004, R-005, R-007 |
| `src/modules/caja/caja.repository.ts` | inserción condicional/no duplicada por usuario activo; update seguro por id+estado; métodos de asociación validan sesión | R-002, R-005, R-006 |
| `src/shared/utils/audit.ts` | reutilizar `recordAuditInTransaction` para auditoría crítica de caja | R-007 |
| `src/modules/facturas/facturas.service.ts` / `repository.ts` | validar que `sesion_caja_id` referencie sesión `abierta` del usuario propietario cuando se cree factura | R-005 |
| `src/db/schema/sesiones_caja.ts` | confirmar convención; índice parcial recomendado para usuario activo si se implementa condición | R-002, R-006 |
| `src/modules/caja/caja.controller.ts` | validar RBAC 403 y propagar códigos | R-008, R-009 |
| `tests/caja.test.ts` | escenarios R-001..R-009 incluyendo concurrencia de apertura/cierre | R-001..R-009 |

## Contratos de UI/API

- `POST /api/caja/abrir`
  - 201 crea sesión
  - 400 si ya hay sesión abierta
- `POST /api/caja/cerrar`
  - 200 devuelve reporte congelado
  - 400 sin sesión abierta
  - 403 sin permiso
- `GET /api/caja/sesiones-activas` (admin)
  - solo `estado = 'abierta'`

## Decisiones tomadas

- ADR nuevo propuesto: `0003-control-caja-e-inmutabilidad.md`
  1. No reabrir sesiones cerradas.
  2. Una sola sesión abierta por usuario.
  3. Cierre congela una fotografía; reportes posteriores se basan en los valores persistidos.
  4. Facturación rechaza sesión inexistente o cerrada.

## Riesgos y mitigación

| Riesgo | Mitigación |
| --- | --- |
| Apertura duplicada bajo concurrencia | transacción + restricción/verificación condicionada |
| Cierre duplicado | segunda request encuentra sesión cerrada |
| Factura asociada a sesión cerrada | validar estado en creación |
| Cálculos flotantes | redondeo explícito a 2 decimales |
| Auditoría fire-and-forget | usar helper transaccional para eventos críticos |

## Condición para implementación

Spec aprobada; plan listo. Generar tasks y luego implementar por tarea.