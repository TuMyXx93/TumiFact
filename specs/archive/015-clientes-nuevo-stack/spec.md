---
id: 015-clientes-nuevo-stack
version: 0.1.0
status: done
type: greenfield
risk: medium
financial-impact: false
---

# 015 — Clientes en el Nuevo Stack

## Contexto

El vertical slice ya cubre auth, productos, ventas e inventario/caja. Falta migrar clientes al nuevo stack para completar el flujo comercial.

## Requisitos (EARS)

- **R-001** — CUANDO se crea un cliente, EL SISTEMA DEBERÁ validar tipo/documento y evitar duplicados.
- **R-002** — CUANDO se actualiza un cliente, EL SISTEMA DEBERÁ preservar relaciones históricas.
- **R-003** — CUANDO se elimina un cliente con facturas/separados, EL SISTEMA DEBERÁ inactivarlo, no borrarlo físicamente.
- **R-004** — CUANDO se busca un cliente, EL SISTEMA DEBERÁ devolver resultados paginados y seguros.
- **R-005** — CUANDO se auditan mutaciones, EL SISTEMA DEBERÁ registrar `CLIENTE_CREADO`, `CLIENTE_ACTUALIZADO`, `CLIENTE_ELIMINADO`.

## Fuera de alcance

- CRM externo.
- Cambios de UI avanzados.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: Cliente duplicado
  Dado un cliente con tipo CC y número 123
  Cuando se crea otro con los mismos datos
  Entonces responde 409
```

### R-003

```gherkin
Escenario: No se borra físicamente
  Dado un cliente con facturas
  Cuando se elimina
  Entonces queda inactivo
  Y las facturas siguen asociadas
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `apps/api/modules/customers` | integration |
| R-002 | `apps/api/modules/customers` | integration |
| R-003 | `apps/api/modules/customers` | integration |
| R-004 | `apps/api/modules/customers` | integration |
| R-005 | `apps/api/modules/customers`, audit | integration |