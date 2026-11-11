'use strict';
const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticate, authorize } = require('../middleware/auth');
const { transferLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { transferValidators } = require('../validators/transferValidators');

router.post('/',
  authenticate,
  authorize('ACCOUNT_HOLDER'),
  transferLimiter,
  transferValidators,
  validate,
  transferController.initiateTransfer
);
router.get('/:id', authenticate, transferController.getTransactionById);

module.exports = router;
