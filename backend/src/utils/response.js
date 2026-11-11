'use strict';
/**
 * Standardized API response helpers.
 * All responses follow: { success, data|error, message, requestId }
 */

const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    requestId: res.locals.requestId,
    timestamp: new Date().toISOString(),
  });
};

const created = (res, data = null, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

const error = (res, message, statusCode = 500, code = 'ERROR', fields = []) => {
  const body = {
    success: false,
    message,
    code,
    requestId: res.locals.requestId,
    timestamp: new Date().toISOString(),
  };
  if (fields.length > 0) body.fields = fields;
  return res.status(statusCode).json(body);
};

module.exports = { success, created, error };
