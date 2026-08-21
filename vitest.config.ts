import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@tumifact/schemas': path.resolve(__dirname, 'packages/schemas/src/index.ts'),
      '@tumifact/types': path.resolve(__dirname, 'packages/types/src/index.ts'),
      '@': path.resolve(__dirname, 'src')
    }
  },
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
      exclude: [
        'src/**/*.spec.ts',
        'src/env.d.ts',
        'src/types/**',
        'src/db/schema/**',
        // Infra de arranque no testeable en unit (requiere proceso real + puertos)
        'src/server.ts',
        'src/server/**',
        'src/middleware.ts',
        'src/pages/**',
        // Client-side browser APIs (IndexedDB, navigator) — cubrir con Playwright
        'src/lib/offline-queue.ts',
        'src/lib/apiClient.ts',
        // BullMQ workers requieren Redis real — cubrir con integration tests dedicados
        'src/jobs/**',
        'src/lib/queue/**'
      ],
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        lines: 55,
        branches: 35,
        functions: 55,
        statements: 55
      }
    }
  }
});
