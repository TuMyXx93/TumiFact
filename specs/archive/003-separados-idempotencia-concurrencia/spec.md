---
id: 003-separados-idempotencia-concurrencia
version: 0.1.0
status: done
type: brownfield
risk: high
financial-impact: true
---

# 003 — Separados: Idempotencia, Reserva de Stock y Cierre Auditable

## Contexto

El módulo de separados soporta creación de planes de apartado y abonos parciales.
Tiene idempotencia por clave UUID, reserva de inventario y generación de factura final al completar el abono.

Debilidades actuales:
- El check de idempotencia se realiza antes de la transacción.
- El cálculo del saldo y la generación de factura final conviven en flujo complejo.
- La auditoría se ejecuta dentro de una transacción que también contiene otras operaciones, pero la idempotencia no es robusta ante race.
- La reserva de stock no usa predicado atómico como en facturas.
- No hay protección formal frente a abonos concurrentes que superen el saldo.

## Requisitos (EARS)

- **R-001** — CUANDO se crea un separado con `Idempotency-Key` ya procesada, EL SISTEMA DEBERÁ devolver el separado existente sin duplicar stock reservado ni insertar abono duplicado.
- **R-002** — MIENTRAS dos solicitudes concurrentes usan la misma clave de creación, EL SISTEMA NO DEBERÁ crear dos separados ni reservar stock dos veces.
- **R-003** — CUANDO se registra un abono con clave idempotente repetida, EL SISTEMA DEBERÁ devolver el abono existente y no alterar `saldo_pendiente` nuevamente.
- **R-004** — CUANDO un abono hace que el saldo llegue a cero, EL SISTEMA DEBERÁ generar factura final y movimientos dentro de la misma transacción.
- **R-005** — MIENTRAS dos abonos concurrentes se registran sobre el mismo separado, EL SISTEMA NO DEBERÁ permitir que el saldo quede negativo ni que la factura final se genere más de una vez.
- **R-006** — CUANDO un separado no está `activo`, EL SISTEMA NO DEBERÁ aceptar abonos ni modificar productos.
- **R-007** — CUANDO se completa un separado, EL SISTEMA DEBERÁ dejarlo `completado` de forma inmutable y registrar `SEPARADO_COMPLETADO`.
- **R-008** — CUANDO el monto de un abono excede el saldo pendiente, EL SISTEMA DEBERÁ rechazar la operación con 400.
- **R-009** — CUANDO se crea un separado, EL SISTEMA DEBERÁ reservar inventario y registrar `separado_reserva` dentro de una transacción.
- **R-010** — CUANDO no existe sesión de caja abierta y la operación la requiere, EL SISTEMA NO DEBERÁ registrar abonos ni generar factura final.

## Fuera de alcance

- Migración de reservas a tabla separada de stock reservado.
- Notificaciones automáticas al vencer plazo.
- Cambios de UI.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: Repetir creación no duplica separado
  Dado un separado creado con clave X
  Cuando se envía otra creación con la misma clave
  Entonces se devuelve el mismo separado
  Y no se inserta reserva duplicada
  Y no se registra SEPARADO_CREADO otra vez
```

### R-003

```gherkin
Escenario: Repetir abono no cambia saldo
  Dado un abono ya registrado con clave Y
  Cuando se repite el mismo abono
  Entonces se devuelve idempotent true
  Y el saldo pendiente no cambia
```

### R-005

```gherkin
Escenario: Dos abonos concurrentes no generan dos facturas
  Dado un separado activo con saldo 1000
  Cuando dos abonos de 1000 llegan simultáneamente
  Entonces solo uno completa el separado
  Y solo se genera una factura final
  Y el otro recibe error de saldo insuficiente o replay
```

### R-008

```gherkin
Escenario: Abono mayor al saldo
  Dado separado con saldo 500
  Cuando se abona 501
  Entonces responde 400
  Y no se modifica saldo
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `src/modules/separados/separados.service.ts`, `repository.ts` | `tests/separados.test.ts` |
| R-002 | `src/modules/separados/separados.repository.ts` | `tests/separados.test.ts` |
| R-003 | `src/modules/separados/separados.service.ts`, `repository.ts` | `tests/separados.test.ts` |
| R-004 | `src/modules/separados/separados.service.ts` | `tests/separados.test.ts` |
| R-005 | `src/modules/separados/separados.service.ts`, `repository.ts` | `tests/separados.test.ts` |
| R-006 | `src/modules/separados/separados.service.ts` | `tests/separados.test.ts` |
| R-007 | `src/modules/separados/separados.service.ts` | `tests/separados.test.ts` |
| R-008 | `src/modules/separados/separados.service.ts` | `tests/separados.test.ts` |
| R-009 | `src/modules/separados/separados.service.ts`, `repository.ts` | `tests/separados.test.ts` |
| R-010 | `src/modules/separados/separados.service.ts` | `tests/separados.test.ts` |