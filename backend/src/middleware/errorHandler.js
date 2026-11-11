'use strict';
const logger = require('../config/logger');
const { AppError, ValidationError } = require('../utils/errors');
const { error: errorResponse } = require('../utils/response');

/**
 * Centralized error handling middleware.
 * Maps known error types to appropriate HTTP responses.
 * Never leaks stack traces or internal details in production.
 */
const errorHandler = (err, req, res, next) => {
  const requestId = res.locals.requestId || req.requestId;

  // Log the error
  if (err.isOperational) {
    logger.warn('Operational error', {
      requestId,
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.error('Unexpected error', {
      requestId,
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Prisma-specific errors
  if (err.code === 'P2002') {
    return errorResponse(res, 'A record with this value already exists', 409, 'CONFLICT');
  }
  if (err.code === 'P2025') {
    return errorResponse(res, 'Record not found', 404, 'NOT_FOUND');
  }

  // Known operational errors
  if (err instanceof ValidationError) {
    return errorResponse(res, err.message, err.statusCode, err.code, err.fields || []);
  }

  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.code);
  }

  // JWT errors (belt-and-suspenders; auth middleware also handles these)
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Unknown errors — don't leak internals
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  return errorResponse(res, message, 500, 'INTERNAL_ERROR');
};

/** 404 handler for unmatched routes */
const notFoundHandler = (req, res, next) => {
  errorResponse(res, `Route ${req.method} ${req.path} not found`, 404, 'ROUTE_NOT_FOUND');
};

module.exports = { errorHandler, notFoundHandler };
