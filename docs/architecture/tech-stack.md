# Stack Tecnológico — TumiFact ⚡

## Capa de Presentación (Frontend)
- **Framework Core:** **Astro v7.1+**
  - Mode: `server` (SSR con `@astrojs/node` standalone adapter)
  - Hidratación selectiva mediante **Islands Architecture**
- **Componentes Interactivos:** **React 19** (`@astrojs/react`)
  - `<BillingPOS client:load />`
  - `<ProductGrid client:idle />`
  - `<ClientManager client:visible />`
- **Estilos & UI:** **Tailwind CSS v4** (`@tailwindcss/vite`) + Google Fonts (Inter / Outfit)
- **Iconos:** `lucide-react`
- **Tipado:** **TypeScript 7.0+** estricto (`tsconfig.json`)

## Capa de Servicios & APIs (Backend Headless API)
- **Runtime:** **Node.js 22+ LTS** (ESM / TypeScript)
- **Framework HTTP:** **Express.js v4 Headless API** (100% JSON Payloads)
- **Compilador & Bundler:** **tsup** (Dual ESM/CJS) + **tsx**
- **Validación de Solicitudes:** `express-validator` & **Zod** DTOs
- **Servicio de Almacenamiento:** `IStorageService` Abstraction (`LocalStorageService` y `MockS3StorageService` listo para Cloudflare R2 / AWS S3)

## Capa de Persistencia (Base de Datos & ORM)
- **Motor:** **PostgreSQL 18.4** en **Docker Alpine** (`tumifact_db`)
- **ORM Type-Safe:** **Drizzle ORM** (v0.45.2) + **Drizzle Kit** (v0.31.10)
- **Driver / Client:** Pool de conexiones nativo `pg` (v8.11+) + Drizzle Client ([`src/db/index.ts`](file:///home/tumidev/developments/TumiFact/src/db/index.ts))
- **Almacenamiento de Multimedia:** Datos binarios `BYTEA` en tabla `configuracion_impresion` (Logo y QR de pagos) con decodificación Base64 en tiempo real para tiquetes térmicos.

## Infraestructura & Calidad
- **Gestor de Paquetes:** `pnpm` (v10+ / v11+)
- **Pruebas Automatizadas:** `Jest` + `Supertest`
- **Integración Continua:** GitHub Actions (`.github/workflows/ci.yml` y `security.yml`)
