# Plan Técnico — 016 Separados en Nuevo Stack

## Diseño

- Módulo `separados` en Fastify.
- Transacción para creación, abono y factura final.
- Lock por separado para abonos concurrentes.
- Validación de estado y saldo.
- Auditoría.

## Cambios por archivo

| Área | Cambio | Requisito |
| --- | --- | --- |
| `apps/api/modules/separados` | CRUD, abonos, factura final | R-001..R-005 |
| `packages/schemas` | DTOs separados | R-001, R-002 |
| `apps/api` audit | auditoría | R-005 |
| tests | integration/concurrency | R-001..R-005 |

## Decisiones

- ADR-0017: Separados y factura final única.
  1. Lock por separado.
  2. Factura final una vez.
  3. Saldo no negativo.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Doble factura | lock + check estado |
| Saldo negativo | validación |
| Concurrencia | transacción |