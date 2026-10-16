# ADR-0006: Reportes Read-Only con Agregación Persistente

- **Estado:** Propuesta (implementada en feature 005)
- **Fecha:** 2026-10-16

## Contexto

Los reportes agregan ventas, inventario y cajas. No mutan datos, pero deben mantener RBAC, scope por operador y totales consistentes.

## Decisión

1. Reportes de ventas solo para `gerente`/`admin`.
2. Exportaciones controladas con códigos de error cuando fallan.
3. Totales a 2 decimales usando valores persistidos.
4. Agregación de sesiones activa reutiliza datos de facturas y abonos.
5. Sin exportación asíncrona en esta fase.