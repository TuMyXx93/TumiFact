---
id: 020-motor-descuentos
version: 0.1.0
status: pending
---

# Tasks — 020 Motor de Descuentos

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0021 de motor determinista | todos | done |
| T-002 | Implementar motor puro de cálculo | R-001, R-006 | done |
| T-003 | Implementar elegibilidad (activo, vigencia, aplica_a) | R-002 | done |
| T-004 | Implementar límites por empleado | R-003 | done |
| T-005 | Implementar permiso de aprobación | R-004 | done |
| T-006 | Persistir origen del descuento en `detalle_factura` | R-005 | done |
| T-007 | CRUD y consulta de catálogo vigente | R-007 | done |
| T-008 | Auditar aplicación de descuento | R-008 | done |
| T-009 | Sembrar descuentos de ejemplo | R-007 | done |
| T-010 | Tests unitarios del motor | R-001..R-006 | done |
| T-011 | Tests de integración de venta con descuento | R-001..R-008 | done |
| T-012 | Ejecutar `/analyze`, CI, trazabilidad | todos | done |

## Notas

- El motor debe ser puro: sin acceso a BD, sin `Date.now()` implícito (la vigencia se recibe como parámetro).
- Misma aritmética en web y API: el motor vive en `packages/discounts`.
- `total` nunca negativo; si el descuento excede el subtotal, la venta se rechaza.
- Un descuento rechazado responde 422 con el motivo, nunca se ignora en silencio.
