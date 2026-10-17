# ADR-0015: Inventario y Caja Atómicos en Fastify

- **Estado:** Aceptada (en implementación)
- **Fecha:** 2026-10-16

## Contexto

El nuevo stack requiere inventario y caja con las mismas garantías del legacy.

## Decisión

1. Movimientos atómicos con transacción Prisma.
2. Salida sin stock suficiente falla.
3. Una sesión abierta por usuario.
4. Cierre inmutable.
5. Eventos Socket.io.