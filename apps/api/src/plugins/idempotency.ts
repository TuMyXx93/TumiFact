import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

export async function idempotencyPlugin(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    const headerKey = request.headers['idempotency-key'];
    const bodyKey = (request.body as any)?.idempotency_key;
    let key = typeof headerKey === 'string' ? headerKey : bodyKey;

    if (!key || typeof key !== 'string') {
      key = randomUUID();
    }

    if (!request.body || typeof request.body !== 'object') {
      (request as any).body = {};
    }
    (request.body as any).idempotency_key = key;
    (request as any).idempotencyKey = key;
  });
}
