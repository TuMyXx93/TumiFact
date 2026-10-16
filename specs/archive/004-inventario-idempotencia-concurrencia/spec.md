---
id: 004-inventario-idempotencia-concurrencia
version: 0.1.0
status: done
type: brownfield
risk: high
financial-impact: true
---

# 004 — Inventario: Idempotencia, Stock Consistente y Kardex Auditable

## Contexto

El módulo de inventario permite movimientos manuales y ajustes rápidos. Tiene idempotencia por clave, pero:

- El check ocurre antes de la transacción.
- `salida_manual` usa `Math.max(0, stock - cantidad)` sin rechazar stock insuficiente.
- `ajusteStockRapido` no valida usuario ni sesión.
- La auditoría es fire-and-forget dentro de la transacción conceptual, pero no se garantiza rollback de audit.
- No hay serialización para movimientos concurrentes del mismo producto, por lo que stock puede derivar incorrecto.

## Requisitos (EARS)

- **R-001** — CUANDO se registra un movimiento con `Idempotency-Key` ya procesada, EL SISTEMA DEBERÁ devolver el movimiento original sin aplicar el delta nuevamente.
- **R-002** — MIENTRAS dos movimientos concurrentes usan la misma clave, EL SISTEMA NO DEBERÁ duplicar movimientos ni alterar stock dos veces.
- **R-003** — CUANDO un movimiento de salida excede el stock disponible, EL SISTEMA DEBERÁ rechazar con `409 INSUFFICIENT_STOCK` o `400` y no modificar el producto.
- **R-004** — CUANDO una entrada o ajuste es válido, EL SISTEMA DEBERÁ actualizar `stock_actual` y registrar el movimiento en la misma transacción.
- **R-005** — MIENTRAS dos movimientos concurrentes del mismo producto se procesan, EL SISTEMA NO DEBERÁ dejar stock calculado con valores perdidos (lost update).
- **R-006** — CUANDO se hace `ajusteStockRapido`, EL SISTEMA DEBERÁ validar que `nuevo_stock >= 0` y registrar motivo obligatorio.
- **R-007** — CUANDO falla auditoría crítica o movimiento, EL SISTEMA DEBERÁ hacer rollback de stock.
- **R-008** — CUANDO se consulta stock crítico, EL SISTEMA DEBERÁ devolver solo productos por debajo del umbral.

## Fuera de alcance

- Migración de stock a reservas por tabla.
- Reconciliación automática de Kardex vs stock_actual.
- Sesiones de inventario separadas de caja.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: Repetir movimiento no duplica stock
  Dado un movimiento registrado con clave K
  Cuando se repite la misma clave
  Entonces se devuelve idempotent true
  Y el stock no cambia
```

### R-003

```gherkin
Escenario: Salida superior al stock
  Dado un producto con stock 3
  Cuando se registra salida manual de 5
  Entonces responde 409 o 400
  Y el stock queda 3
```

### R-005

```gherkin
Escenario: Movimientos concurrentes del mismo producto no pierden updates
  Dado un producto con stock 10
  Cuando dos entradas de 1 llegan simultáneamente
  Entonces stock final es 12
  Y hay 2 movimientos
```

### R-007

```gherkin
Escenario: Falla de auditoría revierte movimiento
  Dado un movimiento válido
  Cuando falla auditoría transaccional
  Entonces no se actualiza stock
  Y no se inserta movimiento
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `src/modules/inventario/inventario.service.ts`, `repository.ts` | `tests/inventario.test.ts` |
| R-002 | `src/modules/inventario/inventario.service.ts` | `tests/inventario.test.ts` |
| R-003 | `src/modules/inventario/inventario.service.ts` | `tests/inventario.test.ts` |
| R-004 | `src/modules/inventario/inventario.service.ts`, `repository.ts` | `tests/inventario.test.ts` |
| R-005 | `src/modules/inventario/inventario.service.ts`, `repository.ts` | `tests/inventario.test.ts` |
| R-006 | `src/modules/inventario/inventario.service.ts`, DTOs | `tests/inventario.test.ts` |
| R-007 | `src/modules/inventario/inventario.service.ts`, audit | `tests/inventario.test.ts` |
| R-008 | `src/modules/inventario/inventario.repository.ts` | `tests/inventario.test.ts` |