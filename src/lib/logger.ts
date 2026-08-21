import pino from 'pino';

export const logger = pino({
  name: 'tumifact-api',
  level: process.env.LOG_LEVEL || 'info',
  // En producción JSON puro para OTel / ELK. En dev, pretty.
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' }
        }
      })
});
