# ADR-0014: Vertical Slice Primero

- **Estado:** Aceptada (en implementación)
- **Fecha:** 2026-10-16

## Contexto

Antes de migrar todos los módulos, se requiere validar la arquitectura con un flujo completo.

## Decisión

1. Implementar login, productos y venta en el nuevo stack.
2. Validar con E2E.
3. Mantener legacy intacto.
4. Rollback por módulo.