'use strict';
require('dotenv').config();

const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { bootstrapAdmin } = require('./utils/adminBootstrap');

let server;

const start = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis (non-fatal if unavailable)
    await connectRedis().catch((err) => {
      logger.warn('Redis unavailable — rate limiting will use memory store', { error: err.message });
    });

    // Bootstrap first admin if enabled
    if (config.admin.bootstrapEnabled) {
      await bootstrapAdmin();
    }

    server = app.listen(config.port, () => {
      logger.info(`BalanceVault API started`, {
        port: config.port,
        env: config.nodeEnv,
        url: `http://localhost:${config.port}`,
      });
    });

  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      await disconnectRedis();
      logger.info('Server shut down cleanly');
      process.exit(0);
    });
    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Force shutdown after timeout');
      process.exit(1);
    }, 10_000);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

start();
