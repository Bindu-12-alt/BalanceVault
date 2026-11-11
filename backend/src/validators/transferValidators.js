'use strict';
const { body } = require('express-validator');

const transferValidators = [
  body('fromAccountId').trim().notEmpty().withMessage('Source account ID is required'),
  body('toAccountId').trim().notEmpty().withMessage('Destination account ID is required'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .custom((val) => {
      const str = String(val).trim();
      if (!/^\d+(\.\d{1,2})?$/.test(str)) {
        throw new Error('Amount must be a positive number with at most 2 decimal places');
      }
      if (parseFloat(str) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      if (parseFloat(str) > 1_00_00_000) {
        throw new Error('Amount exceeds maximum limit of ₹1,00,00,000');
      }
      return true;
    }),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description max 200 chars'),
  body('idempotencyKey')
    .trim()
    .isLength({ min: 8, max: 128 })
    .withMessage('Idempotency key required (8-128 chars)')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Idempotency key must be alphanumeric with - or _'),
];

module.exports = { transferValidators };
