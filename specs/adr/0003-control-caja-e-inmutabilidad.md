# ADR-0003: Control de Caja e Inmutabilidad de Sesión

- **Estado:** Propuesta (en implementación feature 002)
- **Fecha:** 2026-10-16

## Contexto

Una sesión de caja puede abrirse, operar ventas/abonos y cerrarse con arqueo.
Los riesgos son: doble apertura por concurrencia, cierre repetido, cálculos inconsistentes
y mutación de sesiones cerradas.

## Decisión

1. Una sola sesión abierta por usuario usando bloqueo transaccional (`pg_advisory_xact_lock`).
2. El cierre concatena una fotografía inmutable de totales.
3. Una sesión cerrada no se puede recalcular ni aceptar nuevas asociaciones.
4. Auditoría crítica se escribe en la transacción de apertura/cierre.
5. RBAC se valida en rutas para operaciones sensibles; el dueño cierra su propia sesión.