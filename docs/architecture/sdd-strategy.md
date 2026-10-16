# Estrategia de Spec-Driven Development (SDD) para TumiFact

> Documento arquitectónico — adopción e implementación.  
> Base: investigaciones actuales sobre SDD + LL (arXiv 2602.00180, Microsoft SDD AI-Native Engineering 2026, Martin Fowler / GitHub Spec Kit, Allegro 2026, arXiv EPIC 2610.07534, SDAD 2608.20341v1) y referencia de `misak-dictionary`.

## 1. Diagnóstico crítico

TumiFact tiene una arquitectura técnica sólida (Astro 7 + React 19 Islands + Express + Drizzle + PostgreSQL 3NF, RBAC, idempotencia UUID, CI/SAST/SBOM), pero su **gobernanza de intención está dispersa**:

1. `AGENTS.md` documenta un proyecto distinto al real: habla de EJS, `express-validator`, Jest y 17 tests, mientras el código ya usa Astro/React Islands, Zod, Vitest y 57 tests.
2. No existe una capa de especificación dentro del repositorio. `docs/` cubre arquitectura y API, pero no requisitos verificables por feature.
3. No hay constitución ni steering actualizados; las invariantes financieras (idempotencia, stock no negativo, atomicidad, inmutabilidad post-cierre) no están formalizadas como contrato SDD.
4. Los comandos SDD existentes (`/version-gate`, `/review`, `/gen-api`, `/gen-test`, `/check-arch`) no incluyen `/specify`, `/plan`, `/tasks`, `/clarify`, `/analyze` ni gates de documentación/merge.
5. La frontera entre `specs` (intención) y `docs` (arquitectura) no está definida.
6. El ecosistema LLM puede regenerar contexto desde cero en cada sesión, aumentando el riesgo de desalineación con la intención original.

**Conclusión:** antes de continuar con nuevas capacidades (reportes avanzados, mobile, offline, fiscal, multi-tienda), TumiFact necesita convertir su memoria implícita en artefactos versionados y aplicar SDD nivel **spec-anchored**.

## 2. Nivel de rigor recomendado

Usar el mínimo rigor que elimina ambigüedad para cada trabajo:

| Situación | Nivel | Evidencia en proyecto |
| --- | --- | --- |
| Hotfix, cambio trivial | Spec-first condensado (nota en PR) | `Refs: none` |
| Feature POS/API nueva | Spec-anchored (`spec.md` + `plan.md` + `tasks.md` + tests) | flujo completo |
| Módulo financiero/compliance crítico | Spec-anchored con quality checklist EPIC y doble revisión | facturación, caja, separados, inventario |
| Regeneración automática de toda una UI/API | Spec-as-source | solo cuando la tooling esté madura y confiable |

**No adoptar spec-as-source como default** para TumiFact en esta fase: la no determinación del LLM, el acoplamiento con binarios BYTEA y los flujos offline reales hacen que el código siga siendo la autoridad final, con la spec como contrato vivo.

## 3. Arquitectura de gobernanza SDD

Jerarquía estricta:

```text
L0 Constitution (invariantes no negociables)
L0 Steering (stack, convenciones, glosario)
L1 ADRs (decisiones Nygard)
L2 Features/ (spec.md + plan.md + tasks.md + tests)
Código
```

### 3.1 Constitution TumiFact (financial/business gate)

Constantes obligatorias:

- **F1 Idempotencia transaccional**: todo cobro, abono, cierre y ajuste de inventario debe aceptar y validar `Idempotency-Key` UUID; repetición no genera efectos duplicados ni registros parciales.
- **F2 Atomicidad**: cualquier operación que toque stock + factura + caja debe estar dentro de una transacción Drizzle; falla en cualquier punto → rollback completo.
- **F3 Stock no negativo**: ninguna salida puede dejar inventario físico negativo; la validación ocurre en la capa de servicio dentro de la transacción.
- **F4 Inmutabilidad post-cierre**: una sesión de caja cerrada no se recalcula ni se modifica; correcciones se modelan como nueva feature `devoluciones`/`ajustes`.
- **F5 Totales monetarios**: siempre `ROUND(x, 2)` en la frontera API/BD; UI formatea, nunca recalcula confiando en el cliente.
- **F6 Auditoría**: mutaciones críticas (`factura`, `caja`, `separado`, `devolución`, `configuración`) escriben `audit_log` inmutable.
- **F7 RBAC**: los endpoints financieros solo son accesibles según rol (`admin`, `gerente`, `empleado`); cierre de caja y reportes admin requieren permiso explícito.
- **F8 Secrets y datos sensibles**: Argon2id, JWT firmado, sin secretos en logs ni en cliente; lectura de `.env` bloqueada por hook.
- **F9 Accesibilidad/UX POS**: tap targets ≥44px, operación por teclado, feedback visual de sincronización en línea/offline.
- **F10 Tests críticos**: toda operación financiera requiere test de ruta feliz + concurrencia + idempotencia + error.

### 3.2 Steering TumiFact

- `tech-stack.md`: Node 22, pnpm, Astro 7, React 19, Tailwind v4, Express, Socket.io, Drizzle 0.45, PostgreSQL 18.4, Vitest 4, Biome 2.4.
- `conventions.md`: named exports, Zod DTOs, Drizzle en infraestructura, estructura `controller → service → repository`, español en tests/docs, inglés en identificadores.
- `glossary.md`: caja, sesión, apertura/arqueo/cierre, idempotencia, abono, separado, Kardex, RBAC, offline queue, BYTEA.
- `shared-technical-spec.md` (nuevo): estándares transversales (logging pino, correlation id, rate limit, CSRF, timeouts, paginación, códigos error).

### 3.3 Specs por feature

Estructura spec-anchored por feature:

```text
specs/
├── constitution.md
├── steering/
├── adr/
├── features/NNN-slug/{spec.md,plan.md,tasks.md}
└── archive/
```

- Requisitos en EARS numerados `R-001`, `R-002`, etc.
- Criterios de aceptación Gherkin uno-a-uno por requisito.
- Tabla de trazabilidad `Requisito | Archivos | Tests` llena al implementar.
- Front matter: `id`, `version`, `status`, `type` (`greenfield`/`brownfield`), `risk` (`low`/`medium`/`high`), `financial-impact` (`true/false`).
- Estados: `draft → review → approved → in-progress → done → archived`.

## 4. Integración LLM ↔ SDD

### 4.1 Workflow recomendado (7 + 2 fases)

1. `/version-gate` (rama, working tree, tests).
2. `/specify` + LLM dialógico → `spec.md` draft.
3. `/clarify` (nuevo) → preguntas de cobertura, dependencias, edge cases, offline, concurrencia.
4. Revisión humana → `approved`.
5. `/plan` → `plan.md` con diseño, cambios por archivo, contratos Zod/OpenAPI, ADRs, riesgos.
6. `/analyze` (nuevo) → validación de consistencia spec/plan/tasks, huecos y sobreingeniería.
7. `/tasks` → tareas atómicas `T-001`, dependencias, marcador `[P]` parallelizable, one task = one agent invocation.
8. `/implement` → una tarea a la vez, contexto mínimo.
9. `/docs-gate` + tests + lint + build.
10. `/merge-gate` + PR.

### 4.2 Roles de agentes (specialized, aligned with misak)

| Fase | Agente | Responsabilidad |
| --- | --- | --- |
| Governance/spec | architect | constitución, steering, specs, planes, tareas |
| Backend | backend | Clean Architecture + Drizzle transaction + Socket events |
| Frontend/POS UI | frontend | Astro islands, React 19, Tailwind, a11y |
| Tests | tester | tests desde Gherkin, concurrencia, cobertura |
| Review | reviewer (read-only) | calidad, seguridad, arquitectura, desalineación |
| CI/CD/infra | devops | Docker, Actions, migraciones, releases |

### 4.3 Context engineering para LL

- Un agente implementa con **contexto mínimo**: spec + una tarea + archivos referenciados. No el repo completo.
- La spec actúa como super-prompt: requisitos EARS + Gherkin + contratos tipados.
- Las decisiones de stack y reglas se delegan a `steering/`, evitando repetir en cada prompt.
- Los agentes deben leer `context7` para APIs/libs externas, no depender de memoria paramétrica.
- Separar siempre "what to build" (`spec.md`) de "what to build next/how" (`tasks.md`).
- Para cambios grandes, usar **fresh session review**: una sesión limpia revisa el output contra la spec.
- Los LLMs fallan siguiendo instrucciones largas; usar tareas atómicas y acceptance criteria verificables por comando.

### 4.4 Uso de capabilities LLM avanzadas

- Context windows grandes permiten ingerir specs + repo, pero no garantizan obediencia. Se compensa con gates ejecutables.
- Uso de LLM como analista/co-autor de specs, no como autoridad final; humano aprueba `approved`.
- Verificación estocástica: generar/ implementar dos veces o usar reviewer LLM separado para detectar drift.
- TDD desde Gherkin: test fallando → implementación → test verde. El test es el feedback loop que reduce alucinación.
- Checklist como "unit tests for English" (`/checklist`).
- Métricas de calidad de spec: EPIC (Expressive, Precise, Interpretable, Compartmentalized) scoring 0–3.
- Captura de memoria en Engram después de decisiones, bugfixes y cambios estructurales.

## 5. Mobile y web optimization

TumiFact hoy es web-first (Astro + React islands). Para preparar mobile sin duplicar lógica:

1. Convertir los endpoints en **contratos OpenAPI versionados** generados/documentados desde los DTOs Zod.
2. Mantener el backend headless como única autoridad de negocio (offline queue en cliente).
3. Crear en un monorepo `apps/mobile` (React Native/Expo o PWA offline) consumiendo los mismos contratos y shared schemas.
4. Reusar `/specs/features` como fuente para todos los clientes; los criterios Gherkin pueden derivar en E2E mobile.
5. Definir budgets de performance por isla y por endpoint en steering.
6. No permitir que mobile implemente reglas financieras localmente; solo caché/validación UI + sync idempotente.

## 6. Roadmap de implantación en TumiFact

### Fase 0 — Normalización documental (1-2 días)

- Corregir `AGENTS.md`: stack real, Vitest, Astro/React, Drizzle, pnpm.
- Crear `specs/`, constitución, steering, glossary, feature template, ADR 0001.
- Definir gates `docs-gate` y `merge-gate`.
- Migrar los records de `.opencode/memory/*.json` a observaciones Engram por proyecto `tumifact`.

### Fase 1 — Bootstrap SDD sin code changes (2-3 días)

- Añadir `.opencode/commands`: `/specify`, `/plan`, `/tasks`, `/clarify`, `/analyze`, `/checklist`, `/docs-gate`, `/merge-gate`.
- Añadir commitlint plugin `spec-refs`.
- Instalar Husky con `pre-commit` lint-staged, `commit-msg` commitlint, `pre-push` ci + build.
- Crear MCP Postgres de TumiFact por proyecto, no global.
- Añadir script `agents:sync` si se amplía a Antigravity (opcional; por ahora OpenCode canónico).

### Fase 2 — Piloto vertical (1 semana)

Piloto recomendado: **idempotencia y concurrencia en facturación (F2/F3/F4)**. Entregar:
- `specs/features/001-facturacion-idempotente/spec.md`
- `plan.md`
- `tasks.md`
- tests Gherkin → Vitest.
- Medir: bugfix ratio, clarificaciones necesarias, tiempo por task.

### Fase 3 — Expansión incremental (2-4 sprints)

- Caja: apertura/arqueo/cierre.
- Separados y abonos.
- Inventario Kardex.
- Reportes y auditoría.
- Sin saltos masivos; una feature = un PR.

### Fase 4 — Calidad de especificación y métricas (continuo)

- `docs-gate` falla si `feat` cambia módulo crítico sin spec.
- `merge-gate` verifica commits con `Refs:`.
- Métricas: % commits `feat/fix` con `Refs`, ratio commits de bugfix, SER, cobertura por requisito.
- Revisión EPIC trimestral de specs activas.

### Fase 5 — Mobile/monorepo y contratos (cuando haya demanda)

- shared schemas desde `packages/schemas`
- OpenAPI + contract tests (Specmatic)
- mobile app + codegen.

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Burocracia SDD | templates ligeros; `Refs: none` para hotfixes; piloto vertical |
| Spec obsoleta | Constitución C4.3 + docs-gate en mismo commit |
| LLM inventa requisitos | human approval en `review`, `/clarify`, `/analyze` |
| Over-engineering | checklist anti-overengineering antes de implement |
| Context drift | fresh-session review y tareas atómicas |
| Coste de migración brownfield | no reescribir histórico; especificar solo nuevas o críticas |
| Multi-DB leakage entre proyectos | MCP por repo, hooks env-guard |

## 8. Primera decisión solicitada al equipo

Aprobar **ADR-0001: Adoptar SDD spec-anchored para TumiFact**, comenzando con constitución + steering + un piloto de idempotencia en facturación. Si se aprueba, la siguiente ejecución debería ser Fase 0 y Fase 1 (sin cambios functional de código).

## Referencias

- arXiv 2602.00180, *Spec-Driven Development: From Code to Contract in the Age of AI Coding Assistants*.
- Microsoft Developer Blog 2026-06-10, *Spec-Driven Development: A Spec-First Approach to AI-Native Engineering*.
- Martin Fowler, *Understanding Spec-Driven-Development* (2025-10-15).
- GitHub Spec Kit (`github/spec-kit`): constitution, specify, clarify, plan, tasks, analyze, checklist, implement, converge.
- Allegro blog 2026-06-07, *SDD best practices (so far)*.
- arXiv 2610.07534, EPIC Framework for Spec-Driven Development.
- arXiv 2608.20341v1, SDAD: Spec-Driven Agentic Development for the AI-Native SDLC.
- Repo de referencia: `/home/tumidev/developments/misak-dictionary` (constitución, steering, ADR-0001/0002, agentes/sync).
