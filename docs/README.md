# Portal de Documentación — TumiFact 🏢📚

Bienvenido al centro de documentación oficial del **Sistema de Facturación & POS TumiFact**. Este portal está organizado siguiendo el marco de documentación **Diátaxis** para garantizar máxima claridad, mantenibilidad y accesibilidad para desarrolladores y operadores.

---

## 🗺️ Mapa de Navegación

### 1. 🏗️ Arquitectura y Diseño (`docs/architecture/`)
* **[Stack Tecnológico Justificado](architecture/tech-stack.md):** Astro 7+, React 19, Tailwind CSS v4, Express API, Socket.io, Drizzle ORM y PostgreSQL 18.4 (3NF).
* **[Esquema de Base de Datos PostgreSQL](architecture/database-schema.md):** Diagrama relacional completo 3NF con las 19 tablas (`usuarios`, `roles`, `empleados`, `sesiones_caja`, `facturas`, `separados`, `inventario`, etc.).
* **[Visión General de Arquitectura](architecture/README.md):** Principios de arquitectura híbrida desacoplada.

### 2. ⚡ Guías de Desarrollo (`docs/guides/`)
* **[Setup de Desarrollo Local](guides/development-setup.md):** Requisitos, variables de entorno y ejecución con `pnpm dev` y `pnpm dev:api`.
* **[Flujo de Git & Branching Policy](guides/git-workflow.md):** Reglas para trabajar en la rama `dev`, integración continua e integración a `main`.
* **[Evolución de Arquitectura](guides/migraciones-futuras.md):** Hoja de ruta y mejoras técnicas.

### 3. 🔌 Especificación de API REST (`docs/api/`)
* **[Endpoints & Payloads API v2](api/endpoints.md):** Documentación detallada de solicitudes, parámetros, códigos HTTP y ejemplos JSON para todos los endpoints (Auth, Facturas, Caja, Separados, Inventario, Reportes).
* **[Convenciones y Seguridad API](api/README.md):** Autenticación JWT, headers de idempotencia y respuestas estándar.

### 4. 🧠 Registros de Decisiones de Arquitectura (`docs/adr/`)
* **[ADR 0001: Arquitectura Híbrida Desacoplada](adr/0001-multer-2x-migration.md)**
* **[ADR 0002: Migración a PostgreSQL en Docker](adr/0002-postgresql-docker-migration.md)**
* **[ADR 0003: Migración a Astro Framework & React Islands](adr/0003-astro-react-islands-migration.md)**

### 5. 🛠️ Operación & Runbooks (`docs/runbook/`)
* **[Procedimientos de Operaciones](runbook/README.md):** Runbooks de administración y despliegue.

### 6. 📜 Estándares y Gobernanza
* **[Estándares de Documentación](DOCUMENTACION_ESTANDARES.md):** Normas del marco Diátaxis para mantener documentado el proyecto.
* **[Protocolo de Agentes AI](../AGENTS.md):** Reglas y comandos de orquestación (`/version-gate`, `/review`, etc.).
