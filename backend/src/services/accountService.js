'use strict';
const { getPrismaClient } = require('../config/database');
const { createUniqueAccountNumber } = require('../utils/accountNumber');
const { NotFoundError, AuthorizationError, ConflictError } = require('../utils/errors');

const prisma = () => getPrismaClient();

/**
 * Checks that the user's onboarding is APPROVED before allowing account operations.
 */
const requireApprovedOnboarding = async (userId) => {
  const onboarding = await prisma().onboarding.findUnique({
    where: { userId },
    select: { status: true },
  });
  if (!onboarding || onboarding.status !== 'APPROVED') {
    throw new AuthorizationError('Your onboarding must be approved before you can manage accounts');
  }
};

/**
 * Create a new account for a user.
 */
const createAccount = async (userId, { accountType = 'SAVINGS' }) => {
  await requireApprovedOnboarding(userId);

  const accountNumber = await createUniqueAccountNumber();

  const account = await prisma().account.create({
    data: {
      accountNumber,
      userId,
      accountType,
      status: 'ACTIVE',
      balance: 0,
    },
    select: {
      id: true,
      accountNumber: true,
      accountType: true,
      status: true,
      balance: true,
      createdAt: true,
    },
  });

  return account;
};

/**
 * Get all accounts owned by a user.
 */
const getUserAccounts = async (userId) => {
  const accounts = await prisma().account.findMany({
    where: { userId },
    select: {
      id: true,
      accountNumber: true,
      accountType: true,
      status: true,
      balance: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  return accounts;
};

/**
 * Get a single account — validates ownership.
 */
const getAccountById = async (accountId, userId, isAdmin = false) => {
  const account = await prisma().account.findUnique({
    where: { id: accountId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  if (!account) throw new NotFoundError('Account');
  if (!isAdmin && account.userId !== userId) {
    throw new AuthorizationError('You do not have access to this account');
  }

  return account;
};

/**
 * Get transactions for an account — validates ownership.
 */
const getAccountTransactions = async (accountId, userId, isAdmin = false, { page = 1, limit = 20 } = {}) => {
  // Ownership check
  await getAccountById(accountId, userId, isAdmin);

  const where = {
    OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
    status: 'COMPLETED',
  };

  const [transactions, total] = await Promise.all([
    prisma().transaction.findMany({
      where,
      include: {
        fromAccount: { select: { accountNumber: true, user: { select: { firstName: true, lastName: true } } } },
        toAccount: { select: { accountNumber: true, user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma().transaction.count({ where }),
  ]);

  return { transactions, total, page, limit };
};

/**
 * List all accounts (admin).
 */
const listAllAccounts = async ({ status, page = 1, limit = 20 } = {}) => {
  const where = status ? { status } : {};
  const [accounts, total] = await Promise.all([
    prisma().account.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma().account.count({ where }),
  ]);
  return { accounts, total, page, limit };
};

/**
 * Update account status (admin).
 */
const updateAccountStatus = async (accountId, { status }) => {
  const account = await prisma().account.findUnique({ where: { id: accountId } });
  if (!account) throw new NotFoundError('Account');
  if (account.status === status) {
    throw new ConflictError(`Account is already ${status}`);
  }

  const updated = await prisma().account.update({
    where: { id: accountId },
    data: { status },
  });
  return updated;
};

module.exports = {
  createAccount,
  getUserAccounts,
  getAccountById,
  getAccountTransactions,
  listAllAccounts,
  updateAccountStatus,
  requireApprovedOnboarding,
};
