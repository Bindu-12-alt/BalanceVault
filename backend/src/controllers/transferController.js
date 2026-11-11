'use strict';
const transferService = require('../services/transferService');
const { rupeesToPaise } = require('../utils/money');
const { success, created } = require('../utils/response');

const initiateTransfer = async (req, res, next) => {
  try {
    const { fromAccountId, toAccountId, amount, description, idempotencyKey } = req.body;
    const amountPaise = rupeesToPaise(amount);

    const { transaction, cached } = await transferService.executeTransfer(req.user.id, {
      fromAccountId,
      toAccountId,
      amountPaise,
      description,
      idempotencyKey,
      requestId: req.requestId,
      ipAddress: req.ip,
    });

    if (cached) {
      return success(res, { transaction, cached: true }, 'Transfer already processed (idempotent)');
    }
    return created(res, { transaction }, 'Transfer completed successfully');
  } catch (err) {
    next(err);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const tx = await transferService.getTransactionById(req.params.id, req.user.id, isAdmin);
    return success(res, { transaction: tx });
  } catch (err) {
    next(err);
  }
};

module.exports = { initiateTransfer, getTransactionById };
