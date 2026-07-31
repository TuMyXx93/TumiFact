# ADR 0003: Migración a Astro Framework v7+ y React 19 Islands Architecture

## Status
**Aceptado** — Julio 2026

## Contexto
El sistema de facturación requería modernizar su capa de presentación (anteriormente plantillas EJS renderizadas por el backend) hacia un stack de desarrollo web robusto, veloz y escalable para 2026.

## Decisión
Adoptar **Astro v7.1+** con el adaptador `@astrojs/node` en modo `server` (SSR) junto con **React 19** e **Islands Architecture** (`client:load`, `client:idle`, `client:visible`) y **Tailwind CSS v4**.

## Consecuencias
- **Positivas:**
  - Velocidad de carga ultrarrápida al enviar HTML estático renderizado desde el servidor para páginas informativas y tiquetes de impresión.
  - Hidratación selectiva de JavaScript únicamente para componentes interactivos de alta frecuencia (Caja POS, Catálogo de productos, Directorio de clientes).
  - Mantenimiento del backend Express.js y la base de datos PostgreSQL 18.4 sin disrupción en las API REST existentes.
- **Negativas:**
  - Requirió reemplazar el conector `db.js` CommonJS por un helper ESM (`src/lib/db.js`) para compatibilidad con Vite SSR.
