---
id: 006-clientes-normalizacion
version: 0.1.0
status: done
type: brownfield
risk: medium
financial-impact: false
---

# 006 — Clientes: Normalización, Integridad y Auditoría

## Contexto

Clientes alimenta facturación, separados e informes. El sistema normaliza datos por tipo de documento, dirección y tipo de cliente, pero existen riesgos de duplicado, datos incompletos y eliminación con facturas asociadas.

## Requisitos (EARS)

- **R-001** — CUANDO se crea un cliente con tipo/documento, EL SISTEMA DEBERÁ validar que el tipo de identificación exista y el número no esté duplicado cuando se informe.
- **R-002** — CUANDO se actualiza un cliente, EL SISTEMA DEBERÁ preservar la integridad de facturas/separados ya asociados.
- **R-003** — CUANDO se elimina un cliente, EL SISTEMA NO DEBERÁ borrar físicamente si tiene facturas o separados asociados; deberá inactivar o rechazar.
- **R-004** — CUANDO se buscan clientes, EL SISTEMA DEBERÁ devolver resultados normalizados y protegidos por autenticación.
- **R-005** — CUANDO un cliente se inactiva, EL SISTEMA NO DEBERÁ permitir nuevas operaciones activas sobre ese cliente.
- **R-006** — CUANDO se auditan mutaciones, EL SISTEMA DEBERÁ registrar `CLIENTE_CREADO`, `CLIENTE_ACTUALIZADO` y `CLIENTE_ELIMINADO` con actor y datos.

## Fuera de alcance

- Migración de CRM externo.
- Cambios frontend.

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `src/modules/clientes/clientes.service.ts`, DTOs, repo | `tests/clientes.test.ts` |
| R-002 | `src/modules/clientes/clientes.service.ts`, repo | `tests/clientes.test.ts` |
| R-003 | `src/modules/clientes/clientes.repository.ts` | `tests/clientes.test.ts` |
| R-004 | `src/modules/clientes/clientes.service.ts` | `tests/clientes.test.ts` |
| R-005 | `src/modules/clientes/clientes.service.ts` | `tests/clientes.test.ts` |
| R-006 | `src/modules/clientes/clientes.service.ts`, audit | `tests/clientes.test.ts` |