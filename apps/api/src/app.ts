import Fastify from 'fastify';
import { initSocketIO } from './lib/socket';
import { authRoutes } from './modules/auth/auth.routes';
import { cashRoutes } from './modules/cash/cash.routes';
import { customersRoutes } from './modules/customers/customers.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { productsRoutes } from './modules/products/products.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { salesRoutes } from './modules/sales/sales.routes';
import { separadosRoutes } from './modules/separados/separados.routes';
import { idempotencyPlugin } from './plugins/idempotency';

export async function buildApp() {
  const app = Fastify({ logger: false });

  await app.register(idempotencyPlugin);
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(productsRoutes, { prefix: '/api/v1' });
  await app.register(salesRoutes, { prefix: '/api/v1' });
  await app.register(inventoryRoutes, { prefix: '/api/v1' });
  await app.register(cashRoutes, { prefix: '/api/v1' });
  await app.register(customersRoutes, { prefix: '/api/v1' });
  await app.register(separadosRoutes, { prefix: '/api/v1' });
  await app.register(reportsRoutes, { prefix: '/api/v1' });

  app.get('/health', async () => ({ status: 'ok', service: 'tumifact-api' }));
  app.get('/api/v1/health', async () => ({ status: 'ok', service: 'tumifact-api' }));

  initSocketIO(app.server);
  return app;
}
