# ADR-0019: Devoluciones y Cambios en Transacción Única

- **Estado:** Aceptada (en implementación)
- **Fecha:** 2026-10-22

## Contexto

En retail moderno los **cambios de artículo** (exchange) son más frecuentes que las devoluciones monetarias. Un cambio no es una edición silenciosa: es una devolución del producto original más una venta de un producto nuevo, con una diferencia económica explícita.

Riesgos observados en el legacy:

1. El reingreso de stock y el descuento del producto nuevo ocurren en rutas separadas, pudiendo dejar stock descuadrado.
2. La diferencia a pagar/a favor no se materializa como operación trazable.
3. Dos devoluciones concurrentes sobre la misma factura pueden reingresar stock dos veces.
4. No existe vínculo formal entre la factura de cambio y la factura original.

## Decisión

1. **Una sola transacción** por operación: reingreso del devuelto + descuento del nuevo + diferencia + factura/nota de cambio vinculada.
2. **Cambio = devolución + venta nueva**, nunca mutación de la factura original.
3. **Diferencia explícita**: `diferencia > 0` es a pagar, `diferencia < 0` es a favor; se redondea a 2 decimales en la frontera.
4. **Lock por producto** (`pg_advisory_xact_lock`) para serializar operaciones concurrentes que afecten el mismo SKU.
5. **Idempotencia por clave UUID** en la operación completa.
6. **Auditoría y evento**: `DEVOLUCION_CREADA` / `CAMBIO_CREADO` en `audit_log` + `return:created` por Socket.io.
7. La factura original solo cambia su `estado` (`devuelta` / `parcialmente_devuelta`); sus líneas y totales permanecen intactos.

## Alternativas consideradas

- **Editar la factura original** (rechazada): destruye la trazabilidad fiscal y el histórico de caja.
- **Devolución y venta por separado** (rechazada): deja ventana de inconsistencia entre stock y caja.

## Consecuencias

**Positivas:** stock consistente, diferencia auditable, vínculo factura original ↔ cambio, reintentos seguros.

**Negativas:** transacción más larga y con más locks; requiere conocer el precio original de la línea (se toma del `detalle_factura` de origen, no del cliente).

**Riesgos:** el producto nuevo puede no tener stock (se rechaza con 409 antes de tocar nada); la nota de cambio DIAN se implementará en la fase 012.

## Cumplimiento

- R-001, R-002, R-003, R-004, R-005, R-006, R-007 → `apps/api/modules/returns`
