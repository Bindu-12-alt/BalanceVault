'use strict';
const Redis = require('ioredis');
const logger = require('./logger');
const config = require('./env');

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    if (!config.redis.url) {
      logger.warn('REDIS_URL not set — rate limiting will fall back to in-memory');
      return null;
    }

    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
    redisClient.on('close', () => logger.warn('Redis connection closed'));
  }
  return redisClient;
};

const connectRedis = async () => {
  const client = getRedisClient();
  if (client) {
    await client.connect().catch(() => {
      // non-fatal: app works without Redis (falls back to memory rate limiting)
      logger.warn('Redis connection failed — running without Redis');
    });
  }
  return client;
};

const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

module.exports = { getRedisClient, connectRedis, disconnectRedis };
