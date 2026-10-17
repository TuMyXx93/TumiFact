# ADR-0010: Migración Strangler Pattern a Monorepo Fastify + Prisma

- **Estado:** Aceptada (en implementación)
- **Fecha:** 2026-10-16

## Contexto

TumiFact es un monolito con Astro/Express/Drizzle. Se aprobó migrar a monorepo con Fastify 5 + Prisma 7 + React 19 + Vite, manteniendo dominio, seguridad e idempotencia.

## Decisión

1. No big-bang.
2. Legacy coexiste con nuevo stack.
3. Nuevas features solo en nuevo stack.
4. Migración módulo por módulo.
5. Pruebas antes de cutover.
6. Rollback por módulo.

## Consecuencias

Positivas: migración segura y gradual.
Negativas: mantenimiento temporal de dos stacks.
Riesgos: complejidad de sincronización mitigada con feature flags y tests.EOF
echo "created" && find apps packages -maxdepth 3 -type d | sort