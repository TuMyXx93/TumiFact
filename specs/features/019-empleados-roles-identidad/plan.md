# Plan Técnico — 019 Empleados, Roles e Identidad Real

## Diseño

- Módulo `employees` en Fastify: CRUD de empleados, roles y métricas básicas.
- `authPlugin` deja de exponer `usuario_id` fijo: el contexto de request lleva el usuario validado.
- Un helper `getActor(request)` es la **única** fuente de `usuario_id` en todo el nuevo stack.
- Eliminación de los 18 hardcodes `usuario_id: 1`.
- Sesiones (`auth_sessions`) se revocan al desactivar un empleado.

## Cambios por archivo

| Archivo | Cambio | Requisito |
| --- | --- | --- |
| `apps/api/src/lib/auth.ts` | `getActor(request)`, `requireActor`, verificación de sesión activa | R-002, R-004, R-006 |
| `apps/api/src/modules/auth/auth.service.ts` | verificar activo/bloqueado, emitir rol, registrar sesión | R-002, R-003 |
| `apps/api/src/modules/employees/*` | CRUD empleados, roles, auditoría de accesos | R-001, R-005, R-007, R-008 |
| `apps/api/src/modules/sales/*` | actor real en factura y movimientos | R-004 |
| `apps/api/src/modules/inventory/*` | actor real en movimientos | R-004 |
| `apps/api/src/modules/cash/*` | actor real en sesión de caja | R-004 |
| `apps/api/src/modules/separados/*` | actor real | R-004 |
| `apps/api/src/modules/returns/*` | actor real | R-004 |
| `apps/api/src/modules/customers/*` | actor real en auditoría | R-004 |
| `apps/api/src/lib/audit.ts` | parametrizar actor y evitar fallo de negocio | R-006 |
| tests | integración por rol y por actor | R-001..R-008 |

## Contratos

`POST /api/v1/employees`

```json
{
  "nombre": "Kelly",
  "apellido": "Morales",
  "email": "kelly@tumifact.com",
  "password": "Password*2026",
  "rol_nombre": "empleado",
  "telefono": "3001234567",
  "cargo": "Vendedor/Cajero",
  "departamento": "Caja",
  "turno": "completo",
  "descuento_max_porcentaje": 10,
  "descuento_max_monto": 50000
}
```

Respuesta 201: `{ message, empleado }` **sin** `password_hash`.

## Decisiones

- ADR-0020: Identidad real en el nuevo stack.
  1. `getActor(request)` es la única fuente de identidad.
  2. Cero `usuario_id` hardcodeado.
  3. Roles canónicos: `admin`, `gerente`, `empleado`.
  4. Desactivar revoca sesiones.
  5. `password_hash` nunca sale del servidor.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Romper módulos existentes al cambiar actor | tests de integración por módulo |
| Sesiones de token viejo | verificación de sesión activa en cada request |
| Exposición de hash | DTOs de salida explícitos, nunca `select: *` |
| Role no existe | seed de roles canónicos |