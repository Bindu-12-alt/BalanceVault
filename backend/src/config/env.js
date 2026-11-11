'use strict';
/**
 * Centralized, validated environment configuration.
 * Fails fast at startup if required variables are missing.
 */

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const optional = (key, fallback) => process.env[key] ?? fallback;

const config = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '5000'), 10),
  frontendUrl: optional('FRONTEND_URL', 'http://localhost:5173'),

  database: {
    url: required('DATABASE_URL'),
  },

  redis: {
    url: optional('REDIS_URL', ''),
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: optional('JWT_EXPIRES_IN', '15m'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  admin: {
    bootstrapEnabled: optional('ADMIN_BOOTSTRAP_ENABLED', 'false') === 'true',
    bootstrapEmail: optional('ADMIN_BOOTSTRAP_EMAIL', ''),
    bootstrapPassword: optional('ADMIN_BOOTSTRAP_PASSWORD', ''),
    bootstrapFirstName: optional('ADMIN_BOOTSTRAP_FIRST_NAME', 'System'),
    bootstrapLastName: optional('ADMIN_BOOTSTRAP_LAST_NAME', 'Admin'),
  },

  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    maxRequests: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
    authMax: parseInt(optional('AUTH_RATE_LIMIT_MAX', '10'), 10),
  },

  security: {
    bcryptRounds: parseInt(optional('BCRYPT_ROUNDS', '12'), 10),
  },

  isProduction: optional('NODE_ENV', 'development') === 'production',
  isDevelopment: optional('NODE_ENV', 'development') === 'development',
  isTest: optional('NODE_ENV', 'development') === 'test',
};

module.exports = config;
