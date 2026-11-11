'use strict';
const { body, param } = require('express-validator');

const createAccountValidators = [
  body('accountType')
    .optional()
    .isIn(['SAVINGS', 'CURRENT'])
    .withMessage('Account type must be SAVINGS or CURRENT'),
];

const updateAccountStatusValidators = [
  param('id').notEmpty().withMessage('Account ID required'),
  body('status')
    .isIn(['ACTIVE', 'SUSPENDED', 'CLOSED'])
    .withMessage('Status must be ACTIVE, SUSPENDED, or CLOSED'),
];

module.exports = { createAccountValidators, updateAccountStatusValidators };
