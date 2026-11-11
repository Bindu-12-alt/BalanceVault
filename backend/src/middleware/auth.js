'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getPrismaClient } = require('../config/database');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');

/**
 * Verifies the JWT from the Authorization header and attaches user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token expired');
      }
      throw new AuthenticationError('Invalid token');
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('User account not found or deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role-based authorization middleware factory.
 * Usage: authorize('ADMIN') or authorize('ADMIN', 'ACCOUNT_HOLDER')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError());
  }
  if (!roles.includes(req.user.role)) {
    return next(new AuthorizationError('You do not have permission to access this resource'));
  }
  next();
};

/**
 * Shorthand middleware for admin-only routes.
 */
const adminOnly = [authenticate, authorize('ADMIN')];

/**
 * Shorthand middleware for authenticated users of any role.
 */
const anyAuthenticated = [authenticate];

module.exports = { authenticate, authorize, adminOnly, anyAuthenticated };
