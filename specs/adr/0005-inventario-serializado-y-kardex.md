# ADR-0005: Inventario Serializado y Kardex Atómico

- **Estado:** Propuesta (implementada en feature 004)
- **Fecha:** 2026-10-16

## Contexto

Movimientos concurrentes del mismo producto podían generar lost update y stock negativo artificial.

## Decisión

1. Serializar movimientos por producto mediante `pg_advisory_xact_lock(productoId)`.
2. Rechazar salidas sin stock suficiente.
3. Actualizar stock y Kardex en la misma transacción.
4. Auditoría crítica transaccional.
5. Idempotencia por clave UUID.