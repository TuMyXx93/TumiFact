# ADR-0004: Separados, Abonos Concurrentes y Factura Final Única

- **Estado:** Propuesta (implementada en feature 003)
- **Fecha:** 2026-10-16

## Contexto

Separados combina reserva de inventario, pagos parciales, saldo pendiente y generación de factura final.
Los abonos concurrentes pueden generar doble completado o saldo negativo.

## Decisión

1. Idempotencia por clave en separados y abonos.
2. Serializar abonos de un mismo separado con `pg_advisory_xact_lock(separadoId)`.
3. Rechazar abonos que superen el saldo pendiente.
4. Factura final y actualización del separado se escriben en la misma transacción.
5. Stock reserva valida existencias antes de decrementar.
6. Auditoría crítica se escribe con `recordAuditInTransaction`.

## Consecuencias

Positivas: evita doble factura, saldo negativo y reservas ciegas.
Negativas: mayor complejidad transaccional.
Riesgo: el lock puede aumentar latencia para abonos concurrentes del mismo separado (aceptable).