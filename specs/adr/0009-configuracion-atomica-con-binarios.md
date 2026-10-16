# ADR-0009: Configuración Atómica con Binarios

- **Estado:** Propuesta (implementada en feature 008)
- **Fecha:** 2026-10-16

## Contexto

La configuración guarda datos del negocio y binarios de logo/QR para ticket térmico. La carga y validación deben evitar tipos no permitidos y guardados parciales.

## Decisión

1. Validar MIME y tamaño antes de persistir.
2. Persistir configuración en una sola operación (`save` upsert).
3. Mantener DB como fuente primaria para binarios de impresión; storage respaldo.
4. Registrar auditoría para cambios de configuración.
5. Devolver configuración general sin binarios.
