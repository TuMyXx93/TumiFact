# Migraciones Futuras - ECL FRUVER

## Estado Actual
- **Gestor de paquetes**: pnpm (actualizado)
- **Dependencias**: Actualizadas a versiones menores/patches seguros
- **Configuración**: Optimizada con `.npmrc` y `.pnpmfile.cjs`

## Migraciones Pendientes

### 1. Multer 1.x → 2.x (IMPORTANTE - Deprecado)
**Estado**: Versión actual: 1.4.5-lts.2 | Última: 2.2.0

**Por qué migrar**:
- Multer 1.x tiene vulnerabilidades de seguridad conocidas
- Versión 1.x está deprecada
- Multer 2.x incluye fixes de seguridad

**Cambios esperados**:
- API similar pero con algunos cambios en la configuración
- Mejor manejo de errores
- Mejor performance

**Pasos**:
```bash
pnpm update multer@2
```

Luego revisar:
- `/routes/` - Verificar uso de multer
- Ajustar configuración de upload si es necesario
- Testing completo de subida de archivos

**Riesgo**: Medio (cambios en API, requiere testing)

---

### 2. Express 4.x → 5.x (OPCIONAL)
**Estado**: Versión actual: 4.22.2 | Última: 5.2.1

**Por qué migrar**:
- Express 5.x tiene mejoras de performance
- Mejor soporte para async/await
- Actualizaciones de seguridad

**Cambios esperados**:
- Cambios en algunos middleware
- Mejor manejo de errores asincronos
- Potenciales breaking changes

**Pasos**:
```bash
pnpm update express@5
```

Luego revisar:
- Todo el código en `/routes`
- Configuración en `server.js`
- Compatibilidad con middleware existente

**Riesgo**: Alto (breaking changes, requiere testing exhaustivo)

---

### 3. Otras Dependencias (OPCIONALES)
- **dotenv**: 16.6.1 → 17.4.2 (parches de seguridad menores)
- **ejs**: 3.1.10 → 6.0.1 (cambios mayores, verificar compatibilidad)
- **body-parser**: 1.20.6 → 2.3.0 (incluida en Express 5.x)
- **nodemon**: 2.0.22 → 3.1.14 (dev dependency, bajo riesgo)

---

## Recomendaciones

1. **Próximo Sprint**: Planificar migración de Multer 2.x
   - Prioridad: ALTA (seguridad)
   - Esfuerzo: 2-4 horas
   - Testing: Upload de archivos

2. **Después**: Considerar Express 5.x
   - Prioridad: MEDIA (features)
   - Esfuerzo: 4-8 horas
   - Testing: Exhaustivo (toda la app)

3. **Mantenimiento**: Ejecutar regularmente
   ```bash
   pnpm audit          # Verificar vulnerabilidades
   pnpm update         # Parches de seguridad
   ```

---

## Notas
- Mantener `pnpm-lock.yaml` en control de versiones
- No eliminar `.npmrc` ni `.pnpmfile.cjs`
- Comunicar cambios al equipo
