---
id: 014-inventario-caja-nuevo-stack
version: 0.1.0
status: done
type: greenfield
risk: high
financial-impact: true
---

# 014 — Inventario y Caja en el Nuevo Stack

## Contexto

El vertical slice ya valida auth, productos y ventas. Para migrar el POS completo, faltan inventario y caja en `apps/api`, con idempotencia, auditoría y tiempo real.

## Requisitos (EARS)

- **R-001** — CUANDO se registra un movimiento de inventario, EL SISTEMA DEBERÁ actualizar stock y Kardex en la misma transacción.
- **R-002** — CUANDO el stock es insuficiente, EL SISTEMA DEBERÁ rechazar la salida con 409.
- **R-003** — CUANDO se abre caja, EL SISTEMA DEBERÁ impedir una segunda sesión abierta por usuario.
- **R-004** — CUANDO se cierra caja, EL SISTEMA DEBERÁ congelar totales y diferencia.
- **R-005** — CUANDO una sesión está cerrada, EL SISTEMA NO DEBERÁ aceptar nuevas ventas asociadas.
- **R-006** — CUANDO se emite un evento de inventario o caja, EL SISTEMA DEBERÁ notificar por Socket.io.

## Fuera de alcance

- Migración de reportes.
- DIAN real.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: Movimiento atómico
  Dado un producto con stock 10
  Cuando se registra salida de 2
  Entonces stock queda 8
  Y se inserta movimiento
```

### R-003

```gherkin
Escenario: No se permite doble apertura
  Dado un usuario con caja abierta
  Cuando intenta abrir otra
  Entonces responde 400
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `apps/api/modules/inventory` | integration |
| R-002 | `apps/api/modules/inventory` | integration |
| R-003 | `apps/api/modules/cash` | integration |
| R-004 | `apps/api/modules/cash` | integration |
| R-005 | `apps/api/modules/sales`, `cash` | integration |
| R-006 | `apps/api` socket | integration |