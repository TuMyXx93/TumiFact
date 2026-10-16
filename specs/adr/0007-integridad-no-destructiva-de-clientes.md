# ADR-0007: Integridad No Destructiva de Clientes

- **Estado:** Propuesta (implementada en feature 006)
- **Fecha:** 2026-10-16

## Contexto

Clientes puede tener facturas y separados asociados. La eliminación física rompería integridad histórica.

## Decisión

1. No se elimina físicamente; el delete es lógico (`activo=false`).
2. Se valida unicidad compuesta de tipo documento + número cuando ambos existan.
3. La actualización no modifica datos históricos ya persistidos en facturas.

## Consecuencias

Positivas: historial preservado, evitar duplicados, mutaciones auditables.
Negativas: clientes inactivos siguen ocupando IDs.
Riesgos: consultas deben filtrar activos/inactivos adecuadamente.