# Stack Tecnológico — TumiFact Enterprise ⚡

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

## Capa de Servicios & APIs (Backend)
- **Runtime:** **Node.js 20+ / 22+ LTS** (ESM / CommonJS)
- **Framework HTTP:** **Express.js v4**
- **Validación de Solicitudes:** `express-validator`
- **Carga de Archivos:** `multer` (Procesamiento directo a binarios `BYTEA`)

## Capa de Persistencia (Base de Datos)
- **Motor:** **PostgreSQL 18.4** en **Docker Alpine**
- **Driver / Client:** Pool de conexiones nativo `pg` (v8.11+)
- **Almacenamiento de Multimedia:** Datos binarios `BYTEA` en tabla `configuracion_impresion` (Logo y QR de pagos)

## Infraestructura & Calidad
- **Gestor de Paquetes:** `pnpm` (v10+ / v11+)
- **Pruebas Automatizadas:** `Jest` + `Supertest`
- **Integración Continua:** GitHub Actions (`.github/workflows/ci.yml` y `security.yml`)
