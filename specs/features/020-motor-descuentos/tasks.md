---
id: 020-motor-descuentos
version: 0.1.0
status: pending
---

# Tasks — 020 Motor de Descuentos

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0021 de motor determinista | todos | pending |
| T-002 | Implementar motor puro de cálculo | R-001, R-006 | pending |
| T-003 | Implementar elegibilidad (activo, vigencia, aplica_a) | R-002 | pending |
| T-004 | Implementar límites por empleado | R-003 | pending |
| T-005 | Implementar permiso de aprobación | R-004 | pending |
| T-006 | Persistir origen del descuento en `detalle_factura` | R-005 | pending |
| T-007 | CRUD y consulta de catálogo vigente | R-007 | pending |
| T-008 | Auditar aplicación de descuento | R-008 | pending |
| T-009 | Sembrar descuentos de ejemplo | R-007 | pending |
| T-010 | Tests unitarios del motor | R-001..R-006 | pending |
| T-011 | Tests de integración de venta con descuento | R-001..R-008 | pending |
| T-012 | Ejecutar `/analyze`, CI, trazabilidad | todos | pending |

## Notas

- El motor debe ser puro: sin acceso a BD, sin `Date.now()` implícito (la vigencia se recibe como parámetro).
- Misma aritmética en web y API: ubicar el motor en un lugar compartido.
- `total` nunca negativo; si el descuento excede el subtotal, la venta se rechaza.