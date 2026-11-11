'use strict';
const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Runs after express-validator chains.
 * Throws ValidationError with field details if any checks failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fields = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return next(new ValidationError('Validation failed', fields));
  }
  next();
};

module.exports = validate;
