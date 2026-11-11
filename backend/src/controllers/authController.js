'use strict';
const authService = require('../services/authService');
const { success, created } = require('../utils/response');
const { recordAudit } = require('../middleware/auditLogger');

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    const user = await authService.register({ email, password, firstName, lastName, phone });

    await recordAudit({
      actorId: user.id,
      actorRole: 'ACCOUNT_HOLDER',
      action: 'USER_REGISTER',
      targetType: 'User',
      targetId: user.id,
      outcome: 'SUCCESS',
      requestId: req.requestId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return created(res, { user }, 'Registration successful');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    await recordAudit({
      actorId: result.user.id,
      actorRole: result.user.role,
      action: 'USER_LOGIN',
      targetType: 'User',
      targetId: result.user.id,
      outcome: 'SUCCESS',
      requestId: req.requestId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return success(res, result, 'Login successful');
  } catch (err) {
    // Audit failed login (without user ID since we don't know who failed)
    await recordAudit({
      actorId: null,
      actorRole: null,
      action: 'USER_LOGIN',
      targetType: 'User',
      outcome: 'FAILURE',
      requestId: req.requestId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { email: req.body.email },
    });
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return success(res, { user });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    return success(res, result, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    // JWT is stateless; client must discard the token.
    // For production, consider a token denylist in Redis.
    await recordAudit({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action: 'USER_LOGOUT',
      targetType: 'User',
      targetId: req.user?.id,
      outcome: 'SUCCESS',
      requestId: req.requestId,
      ipAddress: req.ip,
    });
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, refreshToken, logout };
