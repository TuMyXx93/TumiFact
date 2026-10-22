import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    setupFiles: ['src/test/setupFiles.ts'],
    // Secuencial: cada archivo hace TRUNCATE de la misma base de pruebas.
    fileParallelism: false,
    pool: 'forks',
    singleFork: true,
    env: {
      // Base dedicada al nuevo stack: no interfiere con la suite legacy
      // (que usa `tumifact_test`).
      DATABASE_URL: 'postgresql://tumifact_user:tumifact_password@localhost:5432/tumifact_test_api',
      JWT_SECRET: 'test-secret',
    },
  },
});
