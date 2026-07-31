# /version-gate — Pre-Task Validation Gate

Command: Validación previa de seguridad y estado de desarrollo antes de modificar código.

## Pasos de Ejecución
1. Verificar que la rama actual sea `dev`.
2. Ejecutar `git status` para asegurar un working tree sin archivos corruptos.
3. Ejecutar `pnpm test` para asegurar que las pruebas estén en verde.
4. Reportar estado `PASS` o detener si existe algún error bloqueante.
