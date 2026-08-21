import { Queue, type QueueOptions } from 'bullmq';
import { logger } from '../logger';
import { queueConnection } from './connection';

export const schedulerQueue = new Queue('tumifact-scheduler', {
  connection: queueConnection as unknown as QueueOptions['connection'],
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export async function initSchedulerQueue(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    logger.info('Skipping scheduler queue init in test env');
    return;
  }

  // BullMQ 6+ usa upsertJobScheduler — jobId se deriva del schedulerId
  await schedulerQueue.upsertJobScheduler(
    'audit-archiver-scheduler',
    { pattern: '0 3 * * 0' }, // Dom 03:00
    { name: 'audit-archiver', data: {}, opts: {} }
  );

  await schedulerQueue.upsertJobScheduler(
    'separados-vencidos-scheduler',
    { pattern: '0 2 * * *' }, // Diario 02:00
    { name: 'separados-vencidos', data: {}, opts: {} }
  );

  await schedulerQueue.upsertJobScheduler(
    'stock-critico-scheduler',
    { pattern: '*/30 * * * *' }, // Cada 30 min
    { name: 'stock-critico', data: {}, opts: {} }
  );

  logger.info('Scheduler queue repeatable jobs registered');
}

export async function closeSchedulerQueue(): Promise<void> {
  await schedulerQueue.close();
  await queueConnection.quit().catch(() => {});
}
