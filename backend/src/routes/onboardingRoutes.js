'use strict';
const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { submitOnboardingValidators } = require('../validators/onboardingValidators');

// User routes
router.post('/submit',
  authenticate, authorize('ACCOUNT_HOLDER'),
  submitOnboardingValidators, validate,
  onboardingController.submitOnboarding
);
router.get('/status', authenticate, onboardingController.getOnboardingStatus);

module.exports = router;
