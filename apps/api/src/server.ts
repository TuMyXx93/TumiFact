import { buildApp } from './app';

const app = await buildApp();

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
