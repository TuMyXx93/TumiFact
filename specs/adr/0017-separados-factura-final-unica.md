# ADR-0017: Separados y Factura Final Única

- **Estado:** Aceptada (en implementación)
- **Fecha:** 2026-10-16

## Contexto

Separados combina reserva de inventario, abonos y factura final.

## Decisión

1. Transacción para creación.
2. Reserva de stock.
3. Abono inicial.
4. Lock para abonos concurrentes (futuro).