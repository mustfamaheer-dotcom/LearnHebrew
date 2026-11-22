import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { startReminderJob } from './jobs/reminderJob';

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL successfully.');

    // Start background pre-lesson reminder engine
    startReminderJob();

    const PORT = parseInt(env.PORT, 10) || 5001;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`LearnHebrew Backend API running on http://localhost:${PORT} and 0.0.0.0:${PORT}`);
      console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
    });

    // Graceful Shutdown handling for container / orchestration lifecycle (SIGTERM, SIGINT)
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[${signal}] Graceful shutdown initiated. Closing connections...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await prisma.$disconnect();
          console.log('PostgreSQL database disconnected cleanly.');
        } catch (err) {
          console.error('Error during PostgreSQL disconnect:', err);
        }
        process.exit(0);
      });

      // Force shutdown if connections do not close within 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown due to timeout (10s).');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection at Promise]', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

main();

