import { createApp } from './app';
import config from './config';
import prisma from './config/prisma';

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('Database connected.');

    const app = createApp();
    app.listen(config.port, () => {
      console.log(`${config.appName} API running on port ${config.port} (${config.env})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

bootstrap();
