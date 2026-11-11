'use strict';
const adminService = require('../services/adminService');
const accountService = require('../services/accountService');
const transferService = require('../services/transferService');
const ledgerService = require('../services/ledgerService');
const { success } = require('../utils/response');
const { recordAudit } = require('../middleware/auditLogger');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return success(res, stats);
  } catch (err) { next(err); }
};

const listUsers = async (req, res, next) => {
  try {
    const { page, limit, role, isActive } = req.query;
    const result = await adminService.listUsers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    return success(res, result);
  } catch (err) { next(err); }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    return success(res, { user });
  } catch (err) { next(err); }
};

const setUserActiveStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await adminService.setUserActiveStatus(req.params.id, isActive);
    await recordAudit({
      actorId: req.user.id, actorRole: 'ADMIN',
      action: isActive ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
      targetType: 'User', targetId: req.params.id,
      outcome: 'SUCCESS', requestId: req.requestId, ipAddress: req.ip,
    });
    return success(res, { user }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (err) { next(err); }
};

const listAllAccounts = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await accountService.listAllAccounts({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
    });
    return success(res, result);
  } catch (err) { next(err); }
};

const updateAccountStatus = async (req, res, next) => {
  try {
    const account = await accountService.updateAccountStatus(req.params.id, req.body);
    await recordAudit({
      actorId: req.user.id, actorRole: 'ADMIN',
      action: 'ACCOUNT_STATUS_UPDATE', targetType: 'Account', targetId: req.params.id,
      outcome: 'SUCCESS', requestId: req.requestId, ipAddress: req.ip,
      metadata: { newStatus: req.body.status },
    });
    return success(res, { account }, 'Account status updated');
  } catch (err) { next(err); }
};

const listAllTransactions = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await transferService.listAllTransactions({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
    });
    return success(res, result);
  } catch (err) { next(err); }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, action, actorId, outcome } = req.query;
    const result = await adminService.getAuditLogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      action, actorId, outcome,
    });
    return success(res, result);
  } catch (err) { next(err); }
};

const verifyLedger = async (req, res, next) => {
  try {
    const report = await ledgerService.verifyLedger();
    await recordAudit({
      actorId: req.user.id, actorRole: 'ADMIN',
      action: 'LEDGER_VERIFY',
      targetType: 'Ledger',
      outcome: 'SUCCESS', requestId: req.requestId, ipAddress: req.ip,
      metadata: { isHealthy: report.isHealthy, issueCount: report.summary.issueCount },
    });
    return success(res, report, report.isHealthy ? 'Ledger is healthy' : 'Ledger has issues');
  } catch (err) { next(err); }
};

module.exports = {
  getDashboardStats, listUsers, getUserById, setUserActiveStatus,
  listAllAccounts, updateAccountStatus, listAllTransactions,
  getAuditLogs, verifyLedger,
};
