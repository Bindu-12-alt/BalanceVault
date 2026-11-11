'use strict';
const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { getRedisClient } = require('../config/redis');

/** GET /health — basic liveness probe */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'balancevault-api' });
});

/** GET /ready — readiness probe (checks DB + Redis) */
router.get('/ready', async (req, res) => {
  const checks = { database: 'unknown', redis: 'unknown' };
  let allHealthy = true;

  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    allHealthy = false;
  }

  try {
    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      await redis.ping();
      checks.redis = 'ok';
    } else {
      checks.redis = 'not_configured';
    }
  } catch {
    checks.redis = 'error';
    // Redis is non-critical — don't mark service as unhealthy
  }

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
