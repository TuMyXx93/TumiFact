# ADR-0013: DIAN Adapter Desacoplado

- **Estado:** Aceptada (en implementación)
- **Fecha:** 2026-10-16

## Contexto

TumiFact debe prepararse para facturación electrónica Colombia sin bloquear ventas internas.

## Decisión

1. Adapter DIAN aislado.
2. Feature flags.
3. Generación UBL 2.1.
4. CUFE.
5. Firma y envío.
6. Contingencia y reintentos.