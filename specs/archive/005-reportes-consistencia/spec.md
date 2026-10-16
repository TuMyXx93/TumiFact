---
id: 005-reportes-consistencia
version: 0.1.0
status: done
type: brownfield
risk: medium
financial-impact: false
---

# 005 — Reportes: Consistencia, RBAC y Exportación Auditable

## Contexto

Los reportes agregan ventas, inventario y separados desde PostgreSQL. Son operaciones de lectura, pero deben ser consistentes, autorizadas y exportables sin exponer datos sensibles ni generar PDF/CSV incorrectos.

## Requisitos (EARS)

- **R-001** — CUANDO un usuario sin permiso solicita reportes de ventas, EL SISTEMA NO DEBERÁ exponer datos y deberá responder 403.
- **R-002** — CUANDO se filtran reportes por usuario o cajero, EL SISTEMA DEBERÁ aplicar scope RBAC automáticamente para operadores restringidos.
- **R-003** — CUANDO se generan totales en reportes, EL SISTEMA DEBERÁ usar valores persistidos y redondeo a 2 decimales, sin recalcular montos ambiguos.
- **R-004** — CUANDO la exportación CSV/PDF falla parcialmente, EL SISTEMA NO DEBERÁ enviar un archivo incompleto sin error controlado.
- **R-005** — CUANDO se consulta historial de ventas, EL SISTEMA DEBERÁ soportar paginación o límite para evitar respuestas masivas.
- **R-006** — CUANDO se exporta inventario, EL SISTEMA DEBERÁ calcular estado stock usando `stock_actual` y `stock_minimo` persistidos.
- **R-007** — CUANDO se solicitan reportes de cajas activas, EL SISTEMA DEBERÁ devolver totales agregados consistentes con facturas y abonos.

## Fuera de alcance

- Dashboards en tiempo real.
- Exportación asíncrona.
- Cambios de UI.

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `src/modules/reportes/reportes.*`, controllers | `tests/reportes.test.ts` |
| R-002 | `src/modules/reportes/*`, middleware auth | `tests/reportes.test.ts` |
| R-003 | `src/modules/reportes/reportes.service.ts` | `tests/reportes.test.ts` |
| R-004 | `src/modules/reportes/reportes.service.ts` | `tests/reportes.test.ts` |
| R-005 | `src/modules/reportes/reportes.service.ts` | `tests/reportes.test.ts` |
| R-006 | `src/modules/reportes/reportes.service.ts` | `tests/reportes.test.ts` |
| R-007 | `src/modules/reportes/reportes.service.ts`, `caja` | `tests/reportes.test.ts` |