'use strict';
const accountService = require('../services/accountService');
const { success, created } = require('../utils/response');
const { recordAudit } = require('../middleware/auditLogger');

const createAccount = async (req, res, next) => {
  try {
    const account = await accountService.createAccount(req.user.id, req.body);
    await recordAudit({
      actorId: req.user.id, actorRole: req.user.role,
      action: 'ACCOUNT_CREATE', targetType: 'Account', targetId: account.id,
      outcome: 'SUCCESS', requestId: req.requestId, ipAddress: req.ip,
      metadata: { accountType: account.accountType },
    });
    return created(res, { account }, 'Account created successfully');
  } catch (err) { next(err); }
};

const getMyAccounts = async (req, res, next) => {
  try {
    const accounts = await accountService.getUserAccounts(req.user.id);
    return success(res, { accounts });
  } catch (err) { next(err); }
};

const getAccountById = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const account = await accountService.getAccountById(req.params.id, req.user.id, isAdmin);
    return success(res, { account });
  } catch (err) { next(err); }
};

const getAccountTransactions = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const { page, limit } = req.query;
    const result = await accountService.getAccountTransactions(
      req.params.id, req.user.id, isAdmin,
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20 }
    );
    return success(res, result);
  } catch (err) { next(err); }
};

module.exports = { createAccount, getMyAccounts, getAccountById, getAccountTransactions };
