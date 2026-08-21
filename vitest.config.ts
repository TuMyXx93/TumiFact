import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.astro', 'tests/api/**'],
    setupFiles: ['tests/env-setup.js'],
    pool: 'forks',
    forks: { singleFork: true } as any,
    sequence: { concurrent: false },
    fileParallelism: false,
    // globalSetup no soportado igual que jest — se hace en setupFiles
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/env.d.ts', 'src/types/**', 'src/db/schema/**'],
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'html'],
      // Fase 3 gate: 55%/35% — hasta completar Fase 1 Strangler (migrar 8 suites legacy a TS)
      // el coverage real es ~5% (solo tests/api/runtime.test.ts). Se relaja a warn-only en CI.
      thresholds: {
        lines: 55,
        branches: 35,
        functions: 55,
        statements: 55
      }
    }
  }
});
