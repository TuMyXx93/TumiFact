---
id: 019-empleados-roles-identidad
version: 0.1.0
status: draft
type: greenfield
risk: high
financial-impact: true
---

# 019 — Empleados, Roles e Identidad Real en el Nuevo Stack

## Contexto

El nuevo stack tiene auth, productos, ventas, inventario, caja, clientes, separados, reportes y devoluciones, pero **no tiene gestión de usuarios**: el `usuario_id` está hardcodeado en `1` en 18 puntos (ventas, movimientos de inventario, caja, separados, devoluciones, auditoría). Consecuencias:

1. La trazabilidad de auditoría es ficticia: todo se atribuye al mismo usuario.
2. El multi-cajero es imposible: dos terminales no se distinguen.
3. El RBAC (`authPlugin` + `requireRole`) no tiene catálogo de roles ni usuarios que lo respalden.
4. `POST /api/v1/customers` no registra quién creó el cliente.

Este módulo cierra la capa de identidad y elimina el hardcode de `usuario_id`.

## Requisitos (EARS)

- **R-001** — CUANDO un administrador crea un empleado, EL SISTEMA DEBERÁ persistir usuario, rol, perfil y hash Argon2id, sin exponer el hash.
- **R-002** — CUANDO un empleado inicia sesión, EL SISTEMA DEBERÁ emitir un JWT con `id`, `rol_id` y `rol_nombre` verificados contra la BD.
- **R-003** — CUANDO un usuario está inactivo o bloqueado, EL SISTEMA NO DEBERÁ permitir el login ni emitir token.
- **R-004** — CUANDO una operación protegida se ejecuta, EL SISTEMA DEBEREA tomar el `usuario_id` del token validado, NUNCA de un valor fijo.
- **R-005** — CUANDO se listan empleados, EL SISTEMA NO DEBERÁ exponer `password_hash` ni devolver filas a roles no autorizados.
- **R-006** — CUANDO un empleado es desactivado, EL SISTEMA DEBERÁ revocar sus sesiones activas y rechazar operaciones futuras.
- **R-007** — CUANDO se consultan roles, EL SISTEMA DEBERÁ exponer los roles canónicos y sus permisos sin datos sensibles.
- **R-008** — CUANDO un usuario intenta una acción no permitida por su rol, EL SISTEMA DEBERÁ responder 403 y registrar el intento.

## Fuera de alcance

- Nóminas y liquidaciones.
- Roles por tienda multi-tenant.
- SSO / OAuth externo.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: Crear empleado
  Dado un admin autenticado
  Cuando crea un empleado con rol 'empleado'
  Entonces responde 201
  Y la respuesta no contiene password_hash
  Y el usuario queda activo
```

### R-004

```gherkin
Escenario: La venta registra al cajero real
  Dado un cajero autenticado con id 7
  Cuando crea una venta
  Entonces la factura.user_id es 7
  Y no 1
```

### R-003

```gherkin
Escenario: Usuario inactivo no entra
  Dado un usuario desactivado
  Cuando intenta login
  Entonces responde 403
```

### R-006

```gherkin
Escenario: Desactivar invalida sesiones
  Dado un empleado con sesión activa
  Cuando el admin lo desactiva
  Entonces su token deja de ser válido
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `apps/api/modules/employees` | integration |
| R-002 | `apps/api/modules/auth`, `apps/api/src/lib/auth.ts` | integration |
| R-003 | `apps/api/modules/auth/auth.service.ts` | integration |
| R-004 | todos los módulos del nuevo stack | integration |
| R-005 | `apps/api/modules/employees` | integration |
| R-006 | `apps/api/modules/employees`, `auth_sessions` | integration |
| R-007 | `apps/api/modules/employees` | integration |
| R-008 | `apps/api/src/lib/auth.ts`, audit | integration |