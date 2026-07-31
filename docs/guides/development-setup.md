# Guía de Instalación y Setup de Desarrollo — TumiFact 🛠️

## 1. Requisitos del Sistema
- **OS:** Linux / macOS / Windows (WSL2)
- **Node.js:** v20.x / v22.x LTS
- **pnpm:** v10.x / v11.x
- **Docker & Docker Compose:** Versión reciente con soporte para containers Linux.

## 2. Pasos de Instalación Rápida

1. **Clonar repositorio:**
   ```bash
   git clone https://github.com/TuMyXx93/TumiFact.git
   cd TumiFact
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

3. **Variables de Entorno (`.env`):**
   ```bash
   cp .env.example .env
   ```

4. **Levantar PostgreSQL 18.4 en Docker:**
   ```bash
   docker-compose up -d
   ```

5. **Iniciar Servidores de Desarrollo:**
   - **Frontend Astro:** `pnpm dev` (`http://localhost:4321`)
   - **Backend Express:** `pnpm dev:api` (`http://localhost:3000`)

6. **Ejecutar Pruebas Automatizadas:**
   ```bash
   pnpm test
   pnpm test:coverage
   ```
