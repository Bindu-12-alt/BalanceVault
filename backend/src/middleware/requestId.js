'use strict';
const { v4: uuidv4 } = require('uuid');

/**
 * Attaches a unique requestId to every request for tracing.
 */
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || uuidv4();
  req.requestId = id;
  res.locals.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};

module.exports = requestId;
