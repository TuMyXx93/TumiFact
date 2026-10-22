---
id: 018-devoluciones-cambios
version: 0.1.0
status: approved
type: greenfield
risk: high
financial-impact: true
---

# 018 — Devoluciones y Cambios (Exchanges) en el Nuevo Stack

## Contexto

En retail moderno, los cambios de producto son más frecuentes que las devoluciones monetarias. El sistema debe soportar devolución, cambio por otro producto y ajuste de diferencia, manteniendo inventario, caja, factura original y auditoría consistentes.

## Requisitos (EARS)

- **R-001** — CUANDO se registra una devolución, EL SISTEMA DEBERÁ validar la factura original y reingresar stock si la condición es buena.
- **R-002** — CUANDO se registra un cambio, EL SISTEMA DEBERÁ sacar el producto nuevo y reingresar el devuelto en la misma transacción.
- **R-003** — CUANDO el valor del cambio difiere del original, EL SISTEMA DEBERÁ registrar diferencia a pagar o a favor.
- **R-004** — CUANDO una devolución o cambio se procesa, EL SISTEMA NO DEBERÁ dejar stock negativo ni duplicar movimientos.
- **R-005** — CUANDO se completa un cambio, EL SISTEMA DEBERÁ generar una nueva factura o nota de cambio vinculada a la original.
- **R-006** — MIENTRAS dos operaciones concurrentes afectan el mismo producto, EL SISTEMA NO DEBERÁ corromper stock.
- **R-007** — CUANDO se audita la operación, EL SISTEMA DEBERÁ registrar `DEVOLUCION_CREADA` o `CAMBIO_CREADO`.

## Fuera de alcance

- Logística de envío.
- Cambios multi-tienda.
- Integración DIAN de notas (fase posterior).

## Criterios de aceptación (Gherkin)

### R-002

```gherkin
Escenario: Cambio por producto de mayor valor
  Dado una factura con producto A
  Cuando el cliente cambia A por B de mayor valor
  Entonces se reingresa A al inventario
  Y se descuenta B del inventario
  Y se registra la diferencia a pagar
```

### R-004

```gherkin
Escenario: Cambio no deja stock negativo
  Dado producto B con stock 0
  Cuando se intenta cambiar hacia B
  Entonces responde 409 INSUFFICIENT_STOCK
  Y no se modifica la factura original
```

### R-005

```gherkin
Escenario: Cambio genera nueva factura
  Dado una venta completada
  Cuando se procesa un cambio
  Entonces se genera una factura o nota de cambio vinculada
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `apps/api/modules/returns` | integration |
| R-002 | `apps/api/modules/returns`, `sales`, `inventory` | integration |
| R-003 | `apps/api/modules/returns` | integration |
| R-004 | `apps/api/modules/returns`, `inventory` | integration |
| R-005 | `apps/api/modules/returns`, `sales` | integration |
| R-006 | `apps/api/modules/returns`, `inventory` | concurrency |
| R-007 | `apps/api/modules/returns`, audit | integration |