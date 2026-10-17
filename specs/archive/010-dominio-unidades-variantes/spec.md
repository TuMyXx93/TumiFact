---
id: 010-dominio-unidades-variantes
version: 0.1.0
status: done
type: greenfield
risk: medium
financial-impact: true
---

# 010 — Dominio: Unidades, Presentaciones y Variantes

## Contexto

El POS debe soportar tecnología, cacharrería, ropa y utensilios. El modelo actual usa unidades mixtas y precios orientados a peso.

## Requisitos (EARS)

- **R-001** — CUANDO se crea un producto, EL SISTEMA DEBERÁ definir unidad base y presentaciones con factor de conversión.
- **R-002** — CUANDO un producto tiene variantes, EL SISTEMA DEBERÁ mantener SKU, precio, stock e imagen por variante.
- **R-003** — CUANDO se vende una presentación, EL SISTEMA DEBERÁ convertir correctamente a unidad base para stock.
- **R-004** — CUANDO se consultan atributos, EL SISTEMA DEBERÁ validarlos contra el esquema de categoría.
- **R-005** — CUANDO se cambian precios, EL SISTEMA DEBERÁ registrar historial auditable.

## Fuera de alcance

- Integración con proveedores externos.
- Importación masiva inicial.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: Producto con presentación
  Dado un producto con unidad base UND
  Cuando se define presentación "Caja x12"
  Entonces el factor de conversión es 12
```

### R-003

```gherkin
Escenario: Venta por presentación descuenta stock base
  Dado un producto con stock 24 UND
  Cuando se vende 1 caja x12
  Entonces el stock queda 12 UND
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `packages/schemas`, `apps/api` | unit |
| R-002 | `apps/api/modules/products` | unit |
| R-003 | `apps/api/modules/sales`, inventory | integration |
| R-004 | `packages/schemas` | unit |
| R-005 | `apps/api/modules/products` | audit test |