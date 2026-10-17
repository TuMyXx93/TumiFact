---
id: 017-reportes-nuevo-stack
version: 0.1.0
status: done
type: greenfield
risk: medium
financial-impact: false
---

# 017 — Reportes en el Nuevo Stack

## Contexto

El nuevo stack ya tiene ventas, inventario, caja y clientes. Faltan reportes consistentes, RBAC y exportaciones.

## Requisitos (EARS)

- **R-001** — CUANDO un usuario sin permiso solicita reportes, EL SISTEMA NO DEBERÁ exponer datos y responderá 403.
- **R-002** — CUANDO se generan totales, EL SISTEMA DEBERÁ usar agregación SQL y redondeo a 2 decimales.
- **R-003** — CUANDO se exporta CSV/PDF, EL SISTEMA NO DEBERÁ enviar archivos incompletos sin error controlado.
- **R-004** — CUANDO se consulta historial, EL SISTEMA DEBERÁ soportar límites y paginación.
- **R-005** — CUANDO se reportan cajas activas, EL SISTEMA DEBERÁ devolver totales consistentes.

## Fuera de alcance

- Dashboards en tiempo real avanzados.
- Exportación asíncrona.

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `apps/api/modules/reports` | integration |
| R-002 | `apps/api/modules/reports` | integration |
| R-003 | `apps/api/modules/reports` | integration |
| R-004 | `apps/api/modules/reports` | integration |
| R-005 | `apps/api/modules/reports`, `cash` | integration |