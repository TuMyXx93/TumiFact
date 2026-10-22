# Plan Técnico — 018 Devoluciones y Cambios en Nuevo Stack

## Diseño

- Módulo `returns` en Fastify con dos operaciones: devolución y cambio.
- Transacción única: reingreso de stock del devuelto + descuento del nuevo + diferencia + factura/nota vinculada.
- Serialización por producto (lock transaccional) para evitar stock corrupto.
- Auditoría y eventos Socket.io.

## Cambios por archivo

| Área | Cambio | Requisito |
| --- | --- | --- |
| `apps/api/modules/returns` | endpoints devolución/cambio | R-001..R-007 |
| `apps/api/modules/inventory` | reingreso/descuento atómico | R-002, R-004, R-006 |
| `apps/api/modules/sales` | factura/nota de cambio vinculada | R-003, R-005 |
| `apps/api` audit | auditoría | R-007 |
| tests | integration + concurrency | R-001..R-007 |

## Contratos

`POST /api/v1/returns` — body:

```json
{
  "factura_id": 42,
  "tipo": "devolucion" | "cambio",
  "items": [
    { "detalle_factura_id": 1, "producto_id": 5, "cantidad_devuelta": 1, "condicion": "bueno" }
  ],
  "cambios": [
    { "producto_id": 9, "cantidad": 1, "precio_unitario": 50000 }
  ],
  "forma_devolucion": "efectivo"
}
```

Respuesta: `{ devolucion, diferencia, factura_id }` donde `diferencia > 0` = a pagar, `< 0` = a favor.

## Decisiones

- ADR-0019: Devoluciones y cambios en transacción única.
  1. Cambio = devolución + venta nueva.
  2. Diferencia explícita, nunca implícita.
  3. Nota/factura vinculada a la original.
  4. Lock por producto.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Stock corrupto | lock + transacción |
| Doble devolución | idempotency key |
| Diferencia mal calculada | redondeo a 2 decimales |
| Nota sin DIAN | fase posterior (012) |