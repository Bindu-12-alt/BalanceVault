'use strict';
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const onboardingController = require('../controllers/onboardingController');
const { adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { reviewOnboardingValidators } = require('../validators/onboardingValidators');
const { updateAccountStatusValidators } = require('../validators/accountValidators');
const { body } = require('express-validator');

// All admin routes require ADMIN role
router.use(adminOnly);

// Dashboard
router.get('/stats', adminController.getDashboardStats);

// Users
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status',
  [body('isActive').isBoolean().withMessage('isActive must be boolean')],
  validate,
  adminController.setUserActiveStatus
);

// Onboarding
router.get('/onboarding', onboardingController.listOnboardingApplications);
router.get('/onboarding/:id', onboardingController.getOnboardingById);
router.patch('/onboarding/:id/review', reviewOnboardingValidators, validate, onboardingController.reviewOnboarding);

// Accounts
router.get('/accounts', adminController.listAllAccounts);
router.patch('/accounts/:id/status', updateAccountStatusValidators, validate, adminController.updateAccountStatus);

// Transactions
router.get('/transactions', adminController.listAllTransactions);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// Ledger
router.get('/ledger/verify', adminController.verifyLedger);

module.exports = router;
