---
id: constitution
version: 0.1.0
status: active
authority: supreme
---

# Constitución de TumiFact — invariantes no negociables

> Autoridad máxima. Si el código contradice este documento, el código está mal.
> Cambios requieren PR dedicado + revisión humana + bump de versión.

## 1. Invariantes financieras y de operación POS

1. **F1 — Idempotencia obligatoria.** Toda operación de cobro, abono, ajuste o cierre transaccional debe recibir y validar `Idempotency-Key` UUID. Repetir una operación no puede producir efectos duplicados ni registros parciales.
2. **F2 — Atomicidad estricta.** Factura + detalle + stock + caja + audit log se escriben dentro de una transacción Drizzle. Falla en cualquier paso → rollback completo.
3. **F3 — Stock no negativo.** Ninguna salida puede dejar inventario físico por debajo de 0. La validación ocurre en la capa de servicio dentro de la transacción.
4. **F4 — Inmutabilidad post-cierre.** Una sesión de caja cerrada no se recalcula ni modifica. Correcciones se modelan como devolución/ajuste en feature separada.
5. **F5 — Dinero en 2 decimales.** Totales siempre redondeados en la frontera API/DB; la UI formatea, no recalcula la verdad.
6. **F6 — Auditoría obligatoria.** Mutaciones críticas (`factura`, `caja`, `separado`, `devolución`, `configuración`) escriben `audit_log` inmutable con actor, IP, timestamp y diff.
7. **F7 — RBAC.** Endpoints financieros requieren rol y permiso explícito; cierre de caja, anulación y reportes admin no se exponen a `empleado` sin permiso.
8. **F8 — Secrets e identidad.** Argon2id para contraseñas, JWT firmado, sin secretos en logs, sin `.env` legible por agentes LLM (guard hook).

## 2. Invariantes técnicas

9. **C2.1 — Convenciones por tooling.** Formato/lint exclusivamente por Biome. No se discute en review lo que Biome decide.
10. **C2.2 — Named exports** por defecto; constantes en `UPPER_SNAKE_CASE`.
11. **C2.3 — Validación con Zod DTOs** en toda entrada HTTP; controllers no acceden a DB sin validación.
12. **C2.4 — Drizzle solo en infraestructura.** No hay queries SQL en controllers.
13. **C2.5 — TDD desde Gherkin.** Todo requisito nuevo debe tener al menos un test vinculado antes de considerarse implementado.
14. **C2.6 — Gates obligatorios.** `/version-gate` antes de código; `/docs-gate` + `/merge-gate` antes de integrar a `dev`.

## 3. UX y accesibilidad POS

15. **UX1 — Tap targets ≥ 44px** en terminal POS.
16. **UX2 — Operación por teclado** y foco visible en flujo de venta.
17. **UX3 — Estado online/offline** siempre visible; acciones queued se reflejan sin pérdida de intención.
18. **UX4 — Confirmación explícita** para anulaciones, abonos y cierre de caja.

## 4. Proceso

19. **P4.1 — Spec antes que código.** Features nuevas requieren spec activa en `specs/features/`.
20. **P4.2 — Trazabilidad.** Commits `feat`/`fix` referencian spec: `Refs: specs/features/NNN-slug`.
21. **P4.3 — Specs vivas.** Si el código cambia un requisito, la spec cambia en el mismo commit.
22. **P4.4 — Cierre auditable.** Toda spec implementada se archiva con sus Gherkin como suite de regresión.
23. **P4.5 — Memoria.** Decisiones, bugs y patrones críticos se guardan en Engram con `What/Why/Where/Learned`.

---

Cambios a esta constitución: PR dedicado, revisión humana, bump de versión y nota en CHANGELOG.