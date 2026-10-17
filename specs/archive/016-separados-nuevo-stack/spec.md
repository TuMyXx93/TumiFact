---
id: 016-separados-nuevo-stack
version: 0.1.0
status: done
type: greenfield
risk: high
financial-impact: true
---

# 016 — Separados en el Nuevo Stack

## Contexto

Separados combina reserva de inventario, abonos y factura final. Ya existe en legacy; se migra al nuevo stack para completar el flujo comercial.

## Requisitos (EARS)

- **R-001** — CUANDO se crea un separado, EL SISTEMA DEBERÁ reservar stock y registrar abono inicial.
- **R-002** — CUANDO se registra un abono, EL SISTEMA DEBERÁ actualizar saldo y generar factura final al completar.
- **R-003** — MIENTRAS dos abonos concurrentes se procesan, EL SISTEMA NO DEBERÁ generar doble factura ni saldo negativo.
- **R-004** — CUANDO el separado no está activo, EL SISTEMA NO DEBERÁ aceptar abonos.
- **R-005** — CUANDO se completa, EL SISTEMA DEBERÁ dejarlo inmutable y registrar auditoría.

## Fuera de alcance

- Notificaciones de vencimiento.
- Cambios frontend avanzados.

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `apps/api/modules/separados` | integration |
| R-002 | `apps/api/modules/separados` | integration |
| R-003 | `apps/api/modules/separados` | concurrency |
| R-004 | `apps/api/modules/separados` | integration |
| R-005 | `apps/api/modules/separados`, audit | integration |