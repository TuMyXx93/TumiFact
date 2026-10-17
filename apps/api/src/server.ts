import Fastify from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { productsRoutes } from './modules/products/products.routes';
import { salesRoutes } from './modules/sales/sales.routes';
import { idempotencyPlugin } from './plugins/idempotency';

const app = Fastify({ logger: true });

await app.register(idempotencyPlugin);
await app.register(authRoutes, { prefix: '/api/v1' });
await app.register(productsRoutes, { prefix: '/api/v1' });
await app.register(salesRoutes, { prefix: '/api/v1' });
await app.register(inventoryRoutes, { prefix: '/api/v1' });

app.get('/health', async () => ({ status: 'ok', service: 'tumifact-api' }));
app.get('/api/v1/health', async () => ({ status: 'ok', service: 'tumifact-api' }));

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
