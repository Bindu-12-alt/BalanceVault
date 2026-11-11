'use strict';
const { getPrismaClient } = require('../config/database');
const logger = require('../config/logger');

/**
 * Records an audit event to the database.
 * Never logs passwords or tokens.
 */
const recordAudit = async ({
  actorId = null,
  actorRole = null,
  action,
  targetType = null,
  targetId = null,
  outcome,
  requestId = null,
  ipAddress = null,
  userAgent = null,
  metadata = null,
}) => {
  try {
    const prisma = getPrismaClient();
    await prisma.auditLog.create({
      data: {
        actorId,
        actorRole,
        action,
        targetType,
        targetId,
        outcome,
        requestId,
        ipAddress,
        userAgent: userAgent ? userAgent.substring(0, 500) : null,
        metadata,
      },
    });
  } catch (err) {
    // Audit failures must NOT break main request flow
    logger.error('Failed to write audit log', { error: err.message, action });
  }
};

/**
 * Express middleware factory that auto-logs a successful action.
 * Wraps res.json to capture the response status.
 */
const auditMiddleware = (action, targetType) => (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const outcome = res.statusCode < 400 ? 'SUCCESS' : 'FAILURE';
    recordAudit({
      actorId: req.user?.id || null,
      actorRole: req.user?.role || null,
      action,
      targetType,
      targetId: req.params?.id || null,
      outcome,
      requestId: req.requestId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: outcome === 'FAILURE' ? { statusCode: res.statusCode } : null,
    });
    return originalJson(body);
  };

  next();
};

module.exports = { recordAudit, auditMiddleware };
