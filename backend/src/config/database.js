'use strict';
const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

let prisma;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? [{ level: 'query', emit: 'event' }, 'warn', 'error']
        : ['warn', 'error'],
    });

    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query', (e) => {
        logger.debug('Prisma Query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        });
      });
    }
  }
  return prisma;
};

const connectDatabase = async () => {
  const client = getPrismaClient();
  await client.$connect();
  logger.info('Database connected successfully');
  return client;
};

const disconnectDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
};

module.exports = { getPrismaClient, connectDatabase, disconnectDatabase };
