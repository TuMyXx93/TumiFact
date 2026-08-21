import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'src/**/*.spec.ts', 'tests/api/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.astro'],
    setupFiles: ['tests/env-setup.js'],
    // globalSetup no soportado igual que jest — se hace en setupFiles
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/env.d.ts', 'src/types/**', 'src/db/schema/**'],
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
