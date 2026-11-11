'use strict';
const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createAccountValidators } = require('../validators/accountValidators');

router.post('/', authenticate, authorize('ACCOUNT_HOLDER'), createAccountValidators, validate, accountController.createAccount);
router.get('/', authenticate, accountController.getMyAccounts);
router.get('/:id', authenticate, accountController.getAccountById);
router.get('/:id/transactions', authenticate, accountController.getAccountTransactions);

module.exports = router;
