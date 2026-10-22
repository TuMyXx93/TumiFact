# Plan Técnico — 020 Motor de Descuentos

## Diseño

- Módulo `discounts` en Fastify con dos responsabilidades: catálogo (CRUD) y motor de cálculo.
- El motor es **puro**: recibe la venta candidata + descuentos aplicables + actor, y devuelve el resultado con el desglose. Sin efectos de segundo → es testeable de forma determinista.
- El cálculo vive en `packages/schemas`/helper compartido para que web y API converg en la misma aritmética.

## Cambios por archivo

| Archivo | Cambio | Requisito |
| --- | --- | --- |
| `apps/api/src/lib/discounts.ts` | motor puro: elegibilidad, límites, cálculo | R-001..R-006 |
| `apps/api/src/modules/discounts/discounts.routes.ts` | catálogo + endpoint de aplicación | R-002, R-007, R-008 |
| `apps/api/src/modules/sales/sales.routes.ts` | aplicar descuentos al crear venta | R-001, R-005, R-006 |
| `apps/api/src/lib/permissions.ts` | permiso `descuentos:aprobar` | R-004 |
| `apps/api/src/modules/employees` | exponer límites del actor | R-003 |
| `apps/api/prisma/seed.ts` | descuentos de ejemplo con vigencias | R-007 |
| tests | unit del motor + integración de venta | R-001..R-008 |

## Contratos

`POST /api/v1/discounts/apply`

```json
{
  "items": [{ "producto_id": 5, "cantidad": 2, "precio_unitario": 100000 }],
  "descuentos": [{ "descuento_id": 3, "producto_id": 5 }]
}
```

Respuesta:

```json
{
  "aplicados": [{ "descuento_id": 3, "producto_id": 5, "valor": 20000, "requiere_aprobacion": false }],
  "rechazados": [{ "descuento_id": 4, "motivo": "EXCEDE_LIMITE_EMPLEADO" }],
  "subtotal": 200000,
  "descuento_total": 20000,
  "total": 180000
}
```

## Decisiones

- ADR-0021: Motor de descuentos determinista.
  1. Motor puro y testeable sin BD.
  2. Límites por empleado (`empleados.descuento_max_*`).
  3. Aprobación por permiso, no por rol hardcode.
  4. El descuento se persiste en `detalle_factura` (id, tipo, valor) para trazabilidad.
  5. El total nunca es negativo; una venta cuyo total no cubre el subtotal se rechaza.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Pérdida de margen | límites por empleado + aprobación |
| Cálculo divergente web/API | motor compartido y puro |
| Descuento fuera de vigencia | filtro de vigencia en elegibilidad |
| Total negativo | clamp a 0 + rechazo de la venta |
| Descuento no trazable | persistencia en `detalle_factura` |