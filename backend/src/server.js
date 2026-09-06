const app = require('./app');
const env = require('./config/env');
const { initDb } = require('./config/db');
const { initRedis } = require('./config/redis');
const { seedDatabase } = require('./db/seed');
const logger = require('./utils/logger');

const startServer = async () => {
  try {
    // 1. Initialize Database
    await initDb();

    // 2. Initialize Redis
    await initRedis();

    // 3. Seed demo data
    await seedDatabase();

    // 4. Start HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info('==================================================');
      logger.info(`🚀 SeatSync Backend running on port ${env.PORT}`);
      logger.info(`📖 Swagger API Docs: http://localhost:${env.PORT}/api/docs`);
      logger.info(`⚡ Concurrency Race Lab: http://localhost:${env.PORT}/api/concurrency/simulate-race`);
      logger.info(`✨ Mode: ${env.NODE_ENV}`);
      logger.info('==================================================');
    });

    // Graceful Shutdown
    const shutdown = async () => {
      logger.info('Shutting down SeatSync server gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
