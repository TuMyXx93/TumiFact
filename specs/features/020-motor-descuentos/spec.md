---
id: 020-motor-descuentos
version: 0.1.0
status: approved
type: greenfield
risk: high
financial-impact: true
---

# 020 — Motor de Descuentos con Límites por Empleado y Aprobación

## Contexto

El catálogo de `descuentos` ya existe en el modelo (`tipo`, `valor`, `aplica_a`, `requiere_aprobacion`, `vigencia_desde/hasta`) y los empleados ya tienen `descuento_max_porcentaje` y `descuento_max_monto`, pero **ninguno de los dos está en uso**: el nuevo stack cobra sin motor de descuentos, y los límites por rol/cajero son inertes.

Riesgos: margen erosionado por descuentos no controlados, descuentos aplicados fuera de vigencia o sobre artículos no elegibles, y descuentos que requieren aprobación aplicables por cualquier cajero.

## Requisitos (EARS)

- **R-001** — CUANDO se aplica un descuento a una venta, EL SISTEMA DEBERÁ calcularlo según su tipo (porcentaje o monto fijo) y aplicarlo a la línea o al total según `aplica_a`.
- **R-002** — CUANDO el descuento no está vigente, inactivo o no aplica al producto, EL SISTEMA NO DEBERÁ aplicarlo.
- **R-003** — CUANDO el descuento excede el límite del empleado (`descuento_max_porcentaje` / `descuento_max_monto`), EL SISTEMA DEBERÁ rechazarlo o marcarlo como requiere aprobación.
- **R-004** — CUANDO un descuento tiene `requiere_aprobacion`, EL SISTEMA NO DEBERÁ aplicarlo sin un rol con permiso de aprobación.
- **R-005** — CUANDO se aplica un descuento, EL SISTEMA DEBEREA persistir su origen en la línea de detalle (id, tipo y valor) para trazabilidad.
- **R-006** — CUANDO se recalcula el total de una venta, EL SISTEMA DEBEREA ser determinista: el descuento nunca puede producir un total negativo.
- **R-007** — CUANDO se consulta el catálogo de descuentos, EL SISTEMA DEBEREA devolver solo los descuentos activos y dentro de vigencia.
- **R-008** — CUANDO se aplica un descuento, EL SISTEMA DEBEREA auditarlo con el actor y el monto aplicado.

## Fuera de alcance

- Descuentos encadenados (cupones apilables).
- Programa de lealtad o puntos.
- Motor de promociones por volumen/segmento.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: Descuento porcentual por línea
  Dado un descuento activo de 10% que aplica a líneas
  Y una línea de 100000
  Cuando se aplica el descuento
  Entonces la línea queda en 90000
```

### R-003

```gherkin
Escenario: Descuento por encima del límite del cajero
  Dado un cajero con límite de 5%
  Y un descuento de 20%
  Cuando se aplica el descuento
  Entonces se rechaza o queda pendiente de aprobación
```

### R-004

```gherkin
Escenario: Descuento que requiere aprobación
  Dado un descuento con requiere_aprobacion activo
  Y un cajero sin permiso de aprobación
  Cuando se aplica el descuento
  Entonces se rechaza con 403
```

### R-006

```gherkin
Escenario: Total nunca negativo
  Dado un descuento de monto fijo mayor al total
  Cuando se aplica el descuento
  Entonces el total es 0
  Y la venta es rejected si el total no cubre los productos
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `apps/api/modules/discounts` | integration |
| R-002 | `apps/api/modules/discounts` | integration |
| R-003 | `apps/api/modules/discounts`, `employees` | integration |
| R-004 | `apps/api/modules/discounts`, `lib/auth` | integration |
| R-005 | `apps/api/modules/discounts`, `sales` | integration |
| R-006 | `apps/api/modules/discounts` | integration |
| R-007 | `apps/api/modules/discounts` | integration |
| R-008 | `apps/api/modules/discounts`, audit | integration |