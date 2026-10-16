---
id: 002-control-caja
version: 0.1.0
status: done
type: brownfield
risk: high
financial-impact: true
---

# 002 — Control de Caja: Apertura, Arqueo y Cierre Auditable

## Contexto

TumiFact controla turnos de POS mediante `sesiones_caja`. Actualmente un usuario puede abrir caja, ver totales en tiempo real y cerrar caja con diferencia declarada vs calculada. Los riesgos principales son:

- Apertura duplicada por concurrencia o doble clic.
- Cierre posterior a modificación de facturas/abonos si no hay inmutabilidad efectiva.
- Diferencia de caja calculada con redondeo inestable o con cálculos dispersos entre servicio y reportes.
- Falta de trazabilidad explícita de apertura/cierre y de permisos RBAC.

## Requisitos (EARS)

- **R-001** — CUANDO un usuario sin sesión abierta solicita `POST /api/caja/abrir`, EL SISTEMA DEBERÁ crear una sesión `abierta` con monto de apertura normalizado a 2 decimales y registrar `CAJA_ABIERTA`.
- **R-002** — CUANDO un usuario con sesión abierta solicita abrir otra caja, EL SISTEMA NO DEBERÁ crear una segunda sesión y deberá responder 400 con mensaje explícito.
- **R-003** — CUANDO se solicita cerrar caja, EL SISTEMA DEBERÁ calcular efectivo esperado como `monto_apertura + ventas_efectivo + abonos_efectivo - devoluciones_aprobadas`, redondeado a 2 decimales.
- **R-004** — CUANDO el monto declarado difiere del calculado, EL SISTEMA DEBERÁ persistir `diferencia_caja` y estado `cerrada`, sin sobrescribir la sesión posteriormente.
- **R-005** — CUANDO una sesión está `cerrada`, EL SISTEMA NO DEBERÁ modificar sus totales, permitir nuevas facturas asociadas ni reabrir la misma sesión.
- **R-006** — MIENTRAS existe una sesión abierta, EL SISTEMA DEBERÁ impedir que otros cierres o facturas “roben” la sesión activa del mismo usuario bajo concurrencia.
- **R-007** — CUANDO se cierra caja, EL SISTEMA DEBERÁ registrar `CAJA_CERRADA` con montos declarado/calculado/diferencia en `audit_log`.
- **R-008** — SI el usuario no tiene permiso RBAC para cerrar/arquear, EL SISTEMA NO DEBERÁ ejecutar la operación y responderá 403.
- **R-009** — CUANDO se solicitan sesiones activas (reporte admin), EL SISTEMA DEBERÁ devolver solo sesiones `abierta` con totales agregados consistentes.

## Fuera de alcance

- Integración con arqueo físico de billetes por denominación.
- Multi-caja por usuario en paralelo.
- Cierre automático por horario.

## Clarificaciones

- `getActiveSession` calcula totales en tiempo real; el cierre congela una fotografía.
- `ventas_efectivo`, transferencia y tarjeta se derivan de facturas `completada` y abonos.
- Devoluciones aprobadas descuentan efectivo esperado.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: Apertura de caja exitosa
  Dado un usuario sin sesión abierta
  Cuando envía monto_apertura 50000
  Entonces se crea una sesión estado 'abierta'
  Y se retorna monto_apertura 50000.00
  Y se registra CAJA_ABIERTA
```

### R-002

```gherkin
Escenario: No se permite segunda sesión abierta
  Dado un usuario con una sesión abierta
  Cuando intenta abrir otra caja
  Entonces responde 400
  Y no se crea nueva sesión
```

### R-003

```gherkin
Escenario: Efectivo esperado correcto
  Dado sesión abierta con apertura 1000
  Y ventas efectivo 300
  Y abonos efectivo 100
  Y devoluciones aprobadas 50
  Cuando se consulta la sesión activa
  Entonces efectivo_esperado es 1350.00
```

### R-004

```gherkin
Escenario: Cierre persiste diferencia
  Dado una sesión abierta
  Cuando se declara un monto diferente al calculado
  Entonces la sesión queda estado 'cerrada'
  Y diferencia_caja se persiste
  Y no puede modificarse después
```

### R-005

```gherkin
Escenario: Sesión cerrada es inmutable
  Dado una sesión cerrada
  Cuando se intenta actualizar sus totales o asociar factura
  Entonces el sistema rechaza la operación
```

### R-006

```gherkin
Escenario: No hay condición de carrera al cerrar
  Dado dos requests de cierre simultáneos del mismo usuario
  Cuando ambos se procesan
  Entonces solo uno cierra la sesión
  Y el otro responde 400 sin sesión abierta
```

### R-007

```gherkin
Escenario: Auditoría de cierre
  Dado una sesión abierta
  Cuando se cierra correctamente
  Entonces se registra CAJA_CERRADA con montos y diferencia
```

### R-008

```gherkin
Escenario: RBAC en cierre
  Dado un usuario sin permiso de cierre
  Cuando intenta cerrar caja
  Entonces responde 403
```

### R-009

```gherkin
Escenario: Sesiones activas para admin
  Dado múltiples sesiones abiertas y cerradas
  Cuando admin consulta sesiones activas
  Entonces solo aparecen las abiertas
  Y los totales son consistentes con facturas asociadas
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `src/modules/caja/caja.service.ts`, `src/modules/caja/caja.repository.ts` | `tests/caja.test.ts` |
| R-002 | `src/modules/caja/caja.service.ts` | `tests/caja.test.ts` |
| R-003 | `src/modules/caja/caja.service.ts` | `tests/caja.test.ts` |
| R-004 | `src/modules/caja/caja.service.ts`, `src/modules/caja/caja.repository.ts` | `tests/caja.test.ts` |
| R-005 | `src/modules/caja/caja.repository.ts` | `tests/caja.test.ts` |
| R-006 | `src/modules/caja/caja.repository.ts` | `tests/caja.test.ts` |
| R-007 | `src/modules/caja/caja.service.ts`, `src/shared/utils/audit.ts` | `tests/caja.test.ts` |
| R-008 | controllers/middleware RBAC | `tests/caja.test.ts` |
| R-009 | `src/modules/caja/caja.service.ts` | `tests/caja.test.ts` |