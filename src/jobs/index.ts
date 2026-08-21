import { type Job, Worker } from 'bullmq';
import { logger } from '../lib/logger';
import { queueConnection } from '../lib/queue/connection';
import { schedulerQueue } from '../lib/queue/scheduler.queue';
import { runAuditArchiver } from './audit-archiver.job';
import { runSeparadosVencidos } from './separados-vencidos.job';
import { runStockCritico } from './stock-critico.job';

export let schedulerWorker: Worker | null = null;

export async function initSchedulerWorker(): Promise<Worker | null> {
  if (process.env.NODE_ENV === 'test') {
    logger.info('Skipping scheduler worker in test env');
    return null;
  }

  schedulerWorker = new Worker(
    'tumifact-scheduler',
    async (job: Job) => {
      logger.info({ job: job.name, id: job.id }, 'Scheduler job start');
      switch (job.name) {
        case 'audit-archiver':
          return await runAuditArchiver();
        case 'separados-vencidos':
          return await runSeparadosVencidos();
        case 'stock-critico':
          return await runStockCritico();
        default:
          logger.warn({ job: job.name }, 'Unknown scheduler job');
          return null;
      }
    },
    { connection: queueConnection as any, concurrency: 1 }
  );

  schedulerWorker.on('completed', (job) => {
    logger.info({ job: job.name, id: job.id }, 'Scheduler job completed');
  });

  schedulerWorker.on('failed', (job, err) => {
    logger.error({ job: job?.name, id: job?.id, err: err.message }, 'Scheduler job failed');
  });

  // Exportar métricas para pino / prom-client si se añade /metrics
  (schedulerQueue as any).schedulerWorker = schedulerWorker;

  logger.info('Scheduler worker started');
  return schedulerWorker;
}

export async function closeSchedulerWorker(): Promise<void> {
  if (schedulerWorker) {
    await schedulerWorker.close();
    schedulerWorker = null;
  }
}
