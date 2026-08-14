# Estándares de Documentación — TumiFact 🏢📖

> **Marco Metodológico**: Basado en el estándar internacional **Diátaxis Documentation Framework** y la estructura profesional de **Tumi Suite**.

---

## 📋 Tabla de Contenidos

1. [Estructura de Carpetas](#estructura-de-carpetas)
2. [Los 4 Pilares del Marco Diátaxis](#los-4-pilares-del-marco-diátaxis)
3. [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)
4. [Estándares de Contenido y Formato](#estándares-de-contenido-y-formato)
5. [Integración con Agentes y Engram Memory Protocol](#integración-con-agentes-y-engram-memory-protocol)

---

## Estructura de Carpetas

```
docs/
├── README.md                          # Índice general de navegación y sitemap
├── DOCUMENTACION_ESTANDARES.md        # Este estándar de documentación
├── adr/                               # Architectural Decision Records (ADRs)
│   ├── 0001-architecture-overview.md
│   ├── 0002-postgresql-docker-migration.md
│   └── 0003-astro-react-islands-migration.md
├── api/                               # Documentación de API REST
│   ├── README.md                      # Índice de API
│   └── endpoints.md                   # Lista exhaustiva de endpoints y payloads
├── architecture/                      # Diseño técnico y modelo de datos
│   ├── README.md                      # Índice de arquitectura
│   ├── tech-stack.md                  # Stack tecnológico justificado
│   └── database-schema.md             # Modelo relacional PostgreSQL
├── features/                          # Documentación de funcionalidades
│   ├── README.md                      # Índice de módulos
│   ├── facturacion-pos.md             # Módulo de Caja POS (React Island)
│   ├── productos.md                   # Gestión de productos
│   └── configuracion.md               # Ajustes e impresión térmica
├── guides/                            # Guías prácticas de desarrollo
│   ├── README.md                      # Índice de guías
│   ├── development-setup.md           # Instalación y setup local
│   ├── git-workflow.md                # Política de ramas y PRs
│   └── migraciones-futuras.md         # Roadmap técnico
└── runbook/                           # Procedimientos operacionales
    ├── README.md                      # Índice operativamente útil
    ├── backup-recovery.md             # Respaldos y restauración PostgreSQL
    └── deployment-checklist.md        # Checklist pre-despliegue
```

---

## Los 4 Pilares del Marco Diátaxis

Toda la documentación técnica de **TumiFact** se organiza en 4 cuadrantes según el propósito y audiencia:

```
                  APRENDIZAJE (Teoría)          TRABAJO (Práctica)
               ┌───────────────────────────┬───────────────────────────┐
               │                           │                           │
  ORIENTADO A  │   TUTORIALES / GUIAS      │     HOW-TO GUIDES         │
  TAREAS       │   (Carga de datos, setup) │     (Despliegues, ADRs)   │
               │                           │                           │
               ├───────────────────────────┼───────────────────────────┤
               │                           │                           │
  ORIENTADO A  │   EXPLICACIÓN             │     REFERENCIA            │
  INFORMACIÓN  │   (Arquitectura, DB Schema)│     (API Endpoints, Types)│
               │                           │                           │
               └───────────────────────────┴───────────────────────────┘
```

1. **Tutoriales / Setup (`docs/guides/development-setup.md`):** Orientado a que cualquier nuevo desarrollador pueda clonar e iniciar el entorno en menos de 5 minutos.
2. **How-To / Procedimientos (`docs/runbook/` y `docs/adr/`):** Pasos concretos para resolver problemas operacionales, realizar respaldos o tomar decisiones de diseño.
3. **Explicación / Arquitectura (`docs/architecture/`):** Contexto profundo de por qué se eligió Astro 7+, React 19 Islands y PostgreSQL 18.4.
4. **Referencia (`docs/api/endpoints.md` y `src/types/index.ts`):** Especificación exacta de datos, códigos de respuesta HTTP e interfaces TypeScript.

---

## Convenciones de Nomenclatura

1. **Archivos Markdown:** Usar minúsculas y guiones cortos (`kebab-case`), excepto `README.md` o archivos estandarizados (`DOCUMENTACION_ESTANDARES.md`).
2. **Títulos:** Usar GitHub-flavored markdown con jerarquía única (`#` para el título principal por archivo).
3. **Enlaces a Archivos:** Usar enlaces relativos navegables sin comillas invertidas dentro de corchetes. Ejemplo: `[Guía de Git](guides/git-workflow.md)`.

---

## Integración con Agentes y Engram Memory Protocol

Toda documentación creada debe mantenerse alineada con el protocolo de agentes definido en **[AGENTS.md](file:///home/tumidev/developments/TumiFact/AGENTS.md)**.
Las decisiones críticas y descubrimientos técnicos se guardan proactivamente en `.opencode/memory/` en formato JSON estandarizado.
