'use strict';
const winston = require('winston');

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const logger = winston.createLogger({
  level: isTest ? 'error' : (isProduction ? 'info' : 'debug'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'balancevault-api' },
  transports: [
    isProduction
      ? new winston.transports.Console()
      : new winston.transports.Console({
          format: combine(colorize(), simple()),
        }),
  ],
  // Never log passwords or tokens — enforced by never passing them to logger
  silent: isTest,
});

module.exports = logger;
