'use strict';
const rateLimit = require('express-rate-limit');
const { getRedisClient } = require('../config/redis');
const config = require('../config/env');
const logger = require('../config/logger');

// Try to import RedisStore — gracefully fall back if Redis isn't available
let RedisStore;
try {
  const rlRedis = require('rate-limit-redis');
  RedisStore = rlRedis.default || rlRedis;
} catch {
  logger.warn('rate-limit-redis not available; using memory store');
}

const buildStore = (prefix) => {
  const client = getRedisClient();
  if (client && RedisStore) {
    return new RedisStore({
      sendCommand: (...args) => client.call(...args),
      prefix: `rl:${prefix}:`,
    });
  }
  return undefined; // falls back to express-rate-limit memory store
};

/** General API rate limiter */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('api'),
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: () => config.isTest,
});

/** Stricter limiter for auth endpoints */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('auth'),
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  skip: () => config.isTest,
});

/** Limiter for transfer endpoints */
const transferLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('transfer'),
  message: {
    success: false,
    message: 'Too many transfer requests, please slow down',
    code: 'TRANSFER_RATE_LIMIT_EXCEEDED',
  },
  skip: () => config.isTest,
});

module.exports = { apiLimiter, authLimiter, transferLimiter };
