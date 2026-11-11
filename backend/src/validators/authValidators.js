'use strict';
const { body } = require('express-validator');

const registerValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required (max 50 chars)'),
  body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required (max 50 chars)'),
  body('phone').optional().matches(/^\+?[\d\s\-()]{7,15}$/).withMessage('Invalid phone number format'),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshValidators = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

module.exports = { registerValidators, loginValidators, refreshValidators };
