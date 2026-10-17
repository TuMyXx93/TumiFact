# ADR-0018: Reportes Read-Only con Agregación Persistente

- **Estado:** Aceptada (en implementación)
- **Fecha:** 2026-10-16

## Contexto

Los reportes agregan ventas y caja. No deben mutar datos.

## Decisión

1. RBAC `gerente`/`admin`.
2. Agregación SQL o parseo consistente.
3. Exportación controlada.
4. Paginación.