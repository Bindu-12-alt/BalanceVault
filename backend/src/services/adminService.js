'use strict';
const { getPrismaClient } = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errors');

const prisma = () => getPrismaClient();

/**
 * Get dashboard statistics.
 */
const getDashboardStats = async () => {
  const [
    totalUsers,
    activeUsers,
    pendingOnboarding,
    totalAccounts,
    activeAccounts,
    totalTransactions,
    totalTransactionVolume,
    recentAuditCount,
  ] = await Promise.all([
    prisma().user.count({ where: { role: 'ACCOUNT_HOLDER' } }),
    prisma().user.count({ where: { role: 'ACCOUNT_HOLDER', isActive: true } }),
    prisma().onboarding.count({ where: { status: 'PENDING' } }),
    prisma().account.count(),
    prisma().account.count({ where: { status: 'ACTIVE' } }),
    prisma().transaction.count({ where: { status: 'COMPLETED' } }),
    prisma().transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma().auditLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return {
    users: { total: totalUsers, active: activeUsers },
    onboarding: { pending: pendingOnboarding },
    accounts: { total: totalAccounts, active: activeAccounts },
    transactions: {
      total: totalTransactions,
      totalVolumePaise: totalTransactionVolume._sum.amount || 0,
    },
    auditLogs: { last24Hours: recentAuditCount },
  };
};

/**
 * List all users with pagination (admin).
 */
const listUsers = async ({ page = 1, limit = 20, role, isActive } = {}) => {
  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive;

  const [users, total] = await Promise.all([
    prisma().user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        onboarding: { select: { status: true } },
        _count: { select: { accounts: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma().user.count({ where }),
  ]);
  return { users, total, page, limit };
};

/**
 * Get a specific user (admin).
 */
const getUserById = async (userId) => {
  const user = await prisma().user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      onboarding: true,
      accounts: {
        select: {
          id: true,
          accountNumber: true,
          accountType: true,
          status: true,
          balance: true,
          createdAt: true,
        },
      },
    },
  });
  if (!user) throw new NotFoundError('User');
  return user;
};

/**
 * Update user active status (admin).
 */
const setUserActiveStatus = async (userId, isActive) => {
  const user = await prisma().user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');
  if (user.role === 'ADMIN') throw new ConflictError('Cannot deactivate admin accounts via this endpoint');

  const updated = await prisma().user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, email: true, isActive: true },
  });
  return updated;
};

/**
 * Get audit logs (admin).
 */
const getAuditLogs = async ({ page = 1, limit = 50, action, actorId, outcome } = {}) => {
  const where = {};
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (actorId) where.actorId = actorId;
  if (outcome) where.outcome = outcome;

  const [logs, total] = await Promise.all([
    prisma().auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma().auditLog.count({ where }),
  ]);
  return { logs, total, page, limit };
};

module.exports = {
  getDashboardStats,
  listUsers,
  getUserById,
  setUserActiveStatus,
  getAuditLogs,
};
