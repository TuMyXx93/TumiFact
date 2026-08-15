# Registros de Decisiones de Arquitectura (ADRs) — TumiFact 🧠

> **Marco**: Michael Nygard ADR Template  
> **Status**: ✅ Documentación viva del proyecto

---

## 📋 Lista de Decisiones de Arquitectura

* **[ADR 0001: Arquitectura Híbrida Desacoplada](0001-multer-2x-migration.md)**
  - Contexto y decisión de separar la capa de presentación (Astro SSR + React Islands) del backend Headless API.
* **[ADR 0002: Migración a PostgreSQL 18.4 en Docker](0002-postgresql-docker-migration.md)**
  - Decisión técnica de migrar a PostgreSQL en contenedor Alpine, soporte de datos binarios `BYTEA` para logotipos y normalización 3NF.
* **[ADR 0003: Migración a Astro Framework & React 19 Islands](0003-astro-react-islands-migration.md)**
  - Selección de Astro v7+ con hidratación selectiva para el rendimiento del Punto de Venta (POS).
