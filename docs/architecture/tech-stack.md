# Stack Tecnológico — TumiFact ⚡

> **Arquitectura:** Arquitectura Híbrida Desacoplada (Astro SSR + React 19 Islands + Express Headless API + Drizzle ORM + PostgreSQL 18.4)

---

## 1. Capa de Presentación (Frontend)
- **Framework Core:** **Astro v7.2+**
  - Modo: `server` (SSR con `@astrojs/node` standalone adapter)
  - Hidratación selectiva mediante **Islands Architecture**
  - Manejo de middleware para autenticación en SSR (`src/middleware.ts`)
- **Componentes Interactivos:** **React 19** (`@astrojs/react`)
  - `<POSIsland client:load />` — Terminal POS con soporte de lectura de códigos, báscula y múltiples formas de pago.
  - `<ControlCaja client:load />` — Apertura, arqueo y cierre de turnos de caja en vivo.
  - `<EmpleadoManager client:load />` — Gestión de colaboradores, asignación de roles RBAC, métricas de rendimiento y auditoría.
  - `<SeparadosManager client:load />` — Gestión de planes de separado y abonos.
  - `<InventarioManager client:load />` — Kardex, stock y ajustes de inventario.
  - `<ReportesManager client:load />` — Filtros de métricas y descarga de reportes PDF/CSV.
  - `<ClientManager client:visible />` — Directorio de clientes normalizado.
- **Estilos & UI:** **Tailwind CSS v4** (`@tailwindcss/vite`) + Google Fonts (Inter / Outfit / JetBrains Mono)
- **Iconos:** `lucide-react`
- **Tipado:** **TypeScript 7.0+** estricto (`tsconfig.json`)

---

## 2. Capa de Servicios & APIs (Backend Headless API)
- **Runtime:** **Node.js 22+ LTS** (ESM / TypeScript)
- **Framework HTTP:** **Express.js v4 Headless API** (100% JSON Payloads)
- **Comunicación en Tiempo Real:** **Socket.io** (Sincronización en vivo de inventario, estado de caja y ventas entre terminales).
- **Seguridad & Criptografía:**
  - Hashing de contraseñas con **Argon2id** (`argon2`).
  - Tokens firmados con **JWT** (`jsonwebtoken`).
  - Control de Acceso Basado en Roles (**RBAC**).
  - Protección de idempotencia transaccional con UUID v4.
- **Compilador & Bundler:** **tsup** (Dual ESM/CJS) + **tsx**
- **Validación de Solicitudes:** Middleware con **Zod** DTOs fuertemente tipados.
- **Exportación de Documentos:** `pdfkit` (Generación de comprobantes y reportes PDF en memoria).
- **Servicio de Almacenamiento:** `IStorageService` Abstraction (`LocalStorageService` y `MockS3StorageService` listo para Cloudflare R2 / AWS S3).

---

## 3. Capa de Persistencia (Base de Datos & ORM)
- **Motor:** **PostgreSQL 18.4** en **Docker Alpine** (`tumifact_db`).
- **Modelo Relacional:** Normalizado en **3NF** (19 tablas con llaves foráneas, restricciones de unicidad e índices optimizados).
- **ORM Type-Safe:** **Drizzle ORM** (v0.45+) + **Drizzle Kit**.
- **Driver / Client:** Pool de conexiones nativo `pg` (v8.11+) + Drizzle Client ([`src/db/index.ts`](file:///home/tumidev/developments/TumiFact/src/db/index.ts)).
- **Almacenamiento de Multimedia:** Datos binarios `BYTEA` en tabla `configuracion_impresion` (Logo y QR de pagos) con decodificación Base64 en tiempo real para tiquetes térmicos.

---

## 4. Infraestructura & Calidad
- **Gestor de Paquetes:** `pnpm` (v10+ / v11+)
- **Pruebas Automatizadas:** `Jest` + `Supertest` (8 suites de pruebas unitarias y de integración, 18 tests con BD de pruebas dedicada).
- **Integración Continua (CI/CD):** GitHub Actions (`ci.yml`, `security.yml`, `sbom.yml`).
