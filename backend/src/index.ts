import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/database';

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL successfully.');

    const PORT = parseInt(env.PORT, 10) || 5001;
    app.listen(PORT, () => {
      console.log(`LearnHebrew Backend API running on http://localhost:${PORT}`);
      console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

