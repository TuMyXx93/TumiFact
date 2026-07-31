# Flujo de Trabajo Git & Branching Policy — TumiFact 🌿

## 📌 Reglas de Integración

1. **Rama Predeterminada de Desarrollo:** `dev`
   - Toda nueva función, refactorización o corrección debe desarrollarse en la rama `dev` (o ramas `feature/*` que se integran hacia `dev`).

2. **Validación CI/CD Automatizada:**
   - Antes de integrar a `main`, el comando `git push origin dev` activará las GitHub Actions (`.github/workflows/ci.yml`).
   - La suite de pruebas debe estar **100% en VERDE** y la compilación `pnpm build` debe ser limpia.

3. **Rama de Producción:** `main`
   - La rama `main` refleja código estable, probado y desplegable a producción.
   - Solo se integra mediante PR / Merge revisado y aprobado.
