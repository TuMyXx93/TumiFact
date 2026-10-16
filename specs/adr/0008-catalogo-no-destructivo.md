# ADR-0008: Catálogo No Destructivo

- **Estado:** Propuesta (implementada en feature 007)
- **Fecha:** 2026-10-16

## Contexto

Productos participa en facturas, inventario y reportes. La eliminación física rompería historial y referencias.

## Decisión

1. Eliminación lógica (`activo=false`) únicamente.
2. Validar códigos duplicados.
3. Precios no negativos por schema.
4. Movimientos de stock deben registrarse en Inventario; el catálogo no debe cegar stock recientemente.