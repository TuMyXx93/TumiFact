# Guías de Desarrollo — TumiFact 🛠️

> **Status**: ✅ Producción | v2.0.0

---

## 📋 Índice de Guías

1. **[Setup de Desarrollo Local](development-setup.md)** — Requisitos, variables de entorno y ejecución de servidores Astro/Express.
2. **[Flujo de Git & Branching Policy](git-workflow.md)** — Reglas para trabajar en la rama `dev`, integración continua y despliegues a `main`.
3. **[Evolución de Arquitectura y Migraciones](migraciones-futuras.md)** — Roadmap técnico del sistema y mejoras planificadas.

---

## 🚀 Inicio Rápido de Comandos

| Propósito | Comando |
| :--- | :--- |
| Instalar dependencias | `pnpm install` |
| Levantar base de datos | `docker-compose up -d` |
| Ejecutar migración y seed | `pnpm tsx scripts/migrate-and-seed-v2.ts` |
| Iniciar frontend Astro | `pnpm dev` |
| Iniciar backend API | `pnpm dev:api` |
| Ejecutar suite de pruebas | `pnpm test` |
