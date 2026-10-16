---
id: glossary
version: 1.0.0
status: active
---

# Steering — Glosario de Dominio POS/Facturación (TumiFact)

## Operación

| Término | Definición |
| --- | --- |
| Caja | Terminal POS físico/lógico donde se realizan ventas y pagos. |
| Sesión de caja | Turno operativo con apertura, movimientos y cierre; inmutable tras cerrar. |
| Apertura / arqueo / cierre | Momentos obligatorios de control de efectivo y comparación sistema vs declarado. |
| Idempotency Key | UUID único que evita operación duplicada ante reintentos. |
| Abono | Pago parcial aplicado a un separado. |
| Separado | Contrato de apartado de mercancía con abonos y fecha de liquidación. |
| Kardex | Movimiento cronológico de inventario con costo unitario. |
| RBAC | Control de acceso basado en roles (`admin`, `gerente`, `empleado`). |

## Técnico / SDD

| Término | Definición |
| --- | --- |
| SDD | Spec-Driven Development: la spec es fuente de verdad; el código la implementa. |
| EARS | Notación `CUANDO/MIENTRAS ... DEBERÁ...` para requisitos atómicos. |
| Gate | Puerta de validación (`version-gate`, `docs-gate`, `merge-gate`). |
| Steering | Contexto técnico estable aplicable a toda spec. |
| BYTES/bytea | Binarios de logo/QR; decodificación en tiempo real. |

## Reglas de lenguaje

- UI, tests, docs y commits: español.
- Código, identificadores, comentarios JSDoc: inglés técnico.