---
id: 007-productos-integridad
version: 0.1.0
status: done
type: brownfield
risk: medium
financial-impact: true
---

# 007 — Productos: Integridad de Catálogo, Precios y Stock

## Contexto

Productos alimenta POS, inventario y facturación. Ya existe validación de código duplicado y precios múltiples, pero faltan garantías para actualizaciones concurrentes y consistencia de stock.

## Requisitos (EARS)

- **R-001** — CUANDO se crea un producto con código existente, EL SISTEMA DEBERÁ rechazar con 409.
- **R-002** — CUANDO se actualiza stock desde catálogo, EL SISTEMA DEBERÁ mantener coherencia con Kardex y no sobrescribir movimientos recientes ciegamente.
- **R-003** — CUANDO se eliminan o inactivan productos con relaciones (facturas/inventario), EL SISTEMA NO DEBERÁ borrar físicamente datos históricos.
- **R-004** — CUANDO se modifican precios, EL SISTEMA DEBERÁ validar que todos los precios relevantes no sean negativos.
- **R-005** — CUANDO se actualiza producto, EL SISTEMA DEBERÁ auditar cambios relevantes.

## Fuera de alcance

- Rediseño de atributos dinámicos.
- Cambios frontend.

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `src/modules/productos/productos.service.ts`, repo | `tests/productos.test.ts` |
| R-002 | `src/modules/productos/productos.service.ts`, inventario | `tests/productos.test.ts` |
| R-003 | `src/modules/productos/productos.repository.ts` | `tests/productos.test.ts` |
| R-004 | `packages/schemas/src/productos.ts` | `tests/productos.test.ts` |
| R-005 | `src/modules/productos/productos.service.ts`, audit | `tests/productos.test.ts` |