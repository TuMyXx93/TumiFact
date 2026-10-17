# ADR-0016: Clientes No Destructivos en Nuevo Stack

- **Estado:** Aceptada (en implementación)
- **Fecha:** 2026-10-16

## Contexto

Clientes participa en facturas y separados. La eliminación física rompe integridad.

## Decisión

1. Soft delete (`activo=false`).
2. Unicidad condicionada por tipo + número.
3. Auditoría de mutaciones.