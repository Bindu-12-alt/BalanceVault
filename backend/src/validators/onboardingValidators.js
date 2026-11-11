'use strict';
const { body, param } = require('express-validator');

const submitOnboardingValidators = [
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name required (2-100 chars)'),
  body('dateOfBirth')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date of birth must be in YYYY-MM-DD format')
    .custom((val) => {
      const dob = new Date(val);
      const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 18) throw new Error('Must be at least 18 years old');
      if (age > 120) throw new Error('Invalid date of birth');
      return true;
    }),
  body('address').trim().isLength({ min: 5, max: 200 }).withMessage('Address required (5-200 chars)'),
  body('city').trim().isLength({ min: 2, max: 100 }).withMessage('City required'),
  body('state').trim().isLength({ min: 2, max: 100 }).withMessage('State required'),
  body('pincode').matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
  body('occupation').trim().isLength({ min: 2, max: 100 }).withMessage('Occupation required'),
  body('annualIncome').trim().notEmpty().withMessage('Annual income required'),
  body('idType')
    .isIn(['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'])
    .withMessage('Invalid ID type'),
  body('idNumber').trim().isLength({ min: 4, max: 20 }).withMessage('ID number required (4-20 chars)'),
];

const reviewOnboardingValidators = [
  param('id').notEmpty().withMessage('Application ID required'),
  body('decision').isIn(['approve', 'reject']).withMessage('Decision must be approve or reject'),
  body('reviewNote').optional().trim().isLength({ max: 500 }).withMessage('Review note max 500 chars'),
];

module.exports = { submitOnboardingValidators, reviewOnboardingValidators };
