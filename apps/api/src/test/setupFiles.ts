import { afterAll, beforeAll } from 'vitest';
import { disconnect, resetDatabase } from './setup';

// Cada archivo de test arranca con la base limpia y re-sembrada.
beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await disconnect();
});
