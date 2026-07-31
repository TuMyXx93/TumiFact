# Portal de Documentación Enterprise — TumiFact 🏢📚

Bienvenido al centro de documentación oficial del **Sistema de Facturación TumiFact**. Este portal está organizado siguiendo el marco de documentación **Diátaxis** para garantizar máxima claridad, mantenibilidad y accesibilidad para desarrolladores y operadores.

---

## 🗺️ Mapa de Navegación

### 1. 🏗️ Arquitectura y Diseño (`docs/architecture/`)
* **[Stack Tecnológico Justificado](architecture/tech-stack.md):** Astro 7+, React 19, Tailwind CSS v4, Express API y PostgreSQL 18.4.
* **[Esquema de Base de Datos PostgreSQL](architecture/database-schema.md):** Diagrama relacional, tablas (`productos`, `clientes`, `facturas`, `detalle_factura`, `configuracion_impresion`) y tipos de datos.

### 2. ⚡ Guías de Desarrollo (`docs/guides/`)
* **[Setup de Desarrollo Local](guides/development-setup.md):** Requisitos, variables de entorno y ejecución con `pnpm dev` y `pnpm dev:api`.
* **[Flujo de Git & Branching Policy](guides/git-workflow.md):** Reglas para trabajar en la rama `dev`, integración continua e integración a `main`.
* **[Roadmap de Migración](guides/migraciones-futuras.md):** Evolución hacia Astro y componentes React Islands.

### 3. 🔌 Especificación de API REST (`docs/api/`)
* **[Endpoints & Payloads API](api/endpoints.md):** Documentación detallada de solicitudes, parámetros, códigos HTTP y ejemplos JSON para todos los endpoints.

### 4. 🧠 Registros de Decisiones de Arquitectura (`docs/adr/`)
* **[ADR 0001: Visión General de Arquitectura](adr/0001-architecture-overview.md)**
* **[ADR 0002: Migración a PostgreSQL en Docker](adr/0002-postgresql-docker-migration.md)**
* **[ADR 0003: Migración a Astro Framework & React Islands](adr/0003-astro-react-islands-migration.md)**

### 5. 🛠️ Operación & Runbooks (`docs/runbook/`)
* **[Respaldos y Recuperación de BD](runbook/backup-recovery.md):** Procedimientos de backup y restore con `pg_dump` y Docker.
* **[Checklist de Despliegue](runbook/deployment-checklist.md):** Pasos pre-despliegue a producción y validación CI/CD.

### 6. 📜 Estándares y Gobernanza
* **[Estándares de Documentación](DOCUMENTACION_ESTANDARES.md):** Normas para mantener documentado el proyecto.
* **[Protocolo de Agentes AI](../AGENTS.md):** Reglas y comandos de orquestación (`/version-gate`, `/review`, etc.).
