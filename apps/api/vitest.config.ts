import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://tumifact_user:tumifact_password@localhost:5432/tumifact_db',
      JWT_SECRET: 'dev-secret',
    },
  },
});
