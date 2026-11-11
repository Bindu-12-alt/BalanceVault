'use strict';
const { getPrismaClient } = require('../config/database');
const { validateAmount } = require('../utils/money');
const {
  NotFoundError,
  AuthorizationError,
  InsufficientFundsError,
  AccountSuspendedError,
  TransferError,
} = require('../utils/errors');
const { recordAudit } = require('../middleware/auditLogger');

const prisma = () => getPrismaClient();

/**
 * Execute a money transfer atomically.
 *
 * Key invariants:
 * 1. Idempotency: same key = same result, no double-debit
 * 2. Integer arithmetic only (paise)
 * 3. Atomic DB transaction — all or nothing
 * 4. Double-entry ledger entries for every transfer
 * 5. Locks on both accounts (SELECT FOR UPDATE) to prevent concurrent overdrafts
 */
const executeTransfer = async (senderId, {
  fromAccountId,
  toAccountId,
  amountPaise,
  description,
  idempotencyKey,
  requestId,
  ipAddress,
}) => {
  // 1. Validate amount
  validateAmount(amountPaise);

  // 2. Check idempotency — return cached response if key already seen
  const existing = await prisma().idempotencyRecord.findUnique({
    where: { key: idempotencyKey },
  });
  if (existing) {
    if (existing.userId !== senderId) {
      throw new AuthorizationError('Idempotency key belongs to another user');
    }
    // Return the cached transaction
    const cachedTx = await prisma().transaction.findUnique({
      where: { idempotencyKey },
      include: {
        fromAccount: { select: { accountNumber: true } },
        toAccount: { select: { accountNumber: true } },
      },
    });
    return { transaction: cachedTx, cached: true };
  }

  // 3. Cannot transfer to self
  if (fromAccountId === toAccountId) {
    throw new TransferError('Source and destination accounts cannot be the same', 'SAME_ACCOUNT');
  }

  // 4. All validation and transfer inside a serializable transaction
  const result = await prisma().$transaction(async (tx) => {
    // Lock both accounts to prevent concurrent transfers
    // Order IDs to avoid deadlock (always lock smaller ID first)
    const [lockFirst, lockSecond] = [fromAccountId, toAccountId].sort();

    const [acc1, acc2] = await Promise.all([
      tx.$queryRaw`SELECT id, "userId", status, balance FROM "Account" WHERE id = ${lockFirst} FOR UPDATE`,
      tx.$queryRaw`SELECT id, "userId", status, balance FROM "Account" WHERE id = ${lockSecond} FOR UPDATE`,
    ]);

    // Map back to named variables
    const fromAcc = acc1[0]?.id === fromAccountId ? acc1[0] : acc2[0];
    const toAcc = acc1[0]?.id === toAccountId ? acc1[0] : acc2[0];

    if (!fromAcc) throw new NotFoundError('Source account');
    if (!toAcc) throw new NotFoundError('Destination account');

    // 5. Ownership check — sender must own the source account
    if (fromAcc.userId !== senderId) {
      throw new AuthorizationError('You do not own the source account');
    }

    // 6. Status checks
    if (fromAcc.status !== 'ACTIVE') {
      throw new AccountSuspendedError('Source account');
    }
    if (toAcc.status !== 'ACTIVE') {
      throw new AccountSuspendedError('Destination account');
    }

    // 7. Balance check (integer arithmetic)
    if (fromAcc.balance < amountPaise) {
      throw new InsufficientFundsError();
    }

    const fromBalanceBefore = fromAcc.balance;
    const toBalanceBefore = toAcc.balance;
    const fromBalanceAfter = fromBalanceBefore - amountPaise;
    const toBalanceAfter = toBalanceBefore + amountPaise;

    // 8. Create the transaction record
    const transaction = await tx.transaction.create({
      data: {
        idempotencyKey,
        fromAccountId,
        toAccountId,
        amount: amountPaise,
        description: description || null,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // 9. Debit source account
    await tx.account.update({
      where: { id: fromAccountId },
      data: { balance: fromBalanceAfter },
    });

    // 10. Credit destination account
    await tx.account.update({
      where: { id: toAccountId },
      data: { balance: toBalanceAfter },
    });

    // 11. Double-entry ledger entries
    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: transaction.id,
          accountId: fromAccountId,
          entryType: 'DEBIT',
          amount: amountPaise,
          balanceBefore: fromBalanceBefore,
          balanceAfter: fromBalanceAfter,
        },
        {
          transactionId: transaction.id,
          accountId: toAccountId,
          entryType: 'CREDIT',
          amount: amountPaise,
          balanceBefore: toBalanceBefore,
          balanceAfter: toBalanceAfter,
        },
      ],
    });

    // 12. Store idempotency record
    await tx.idempotencyRecord.create({
      data: {
        key: idempotencyKey,
        userId: senderId,
        requestHash: idempotencyKey, // key is already the unique token
        responseStatus: 201,
        responseBody: { transactionId: transaction.id, status: 'COMPLETED' },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return transaction;
  }, {
    isolationLevel: 'Serializable',
    timeout: 15000,
  });

  // 13. Audit log (outside transaction — non-critical)
  await recordAudit({
    actorId: senderId,
    actorRole: 'ACCOUNT_HOLDER',
    action: 'TRANSFER',
    targetType: 'Transaction',
    targetId: result.id,
    outcome: 'SUCCESS',
    requestId,
    ipAddress,
    metadata: { fromAccountId, toAccountId, amountPaise },
  });

  return { transaction: result, cached: false };
};

/**
 * Get a single transaction (validates ownership).
 */
const getTransactionById = async (transactionId, userId, isAdmin = false) => {
  const tx = await prisma().transaction.findUnique({
    where: { id: transactionId },
    include: {
      fromAccount: {
        select: {
          accountNumber: true,
          userId: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      toAccount: {
        select: {
          accountNumber: true,
          userId: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      ledgerEntries: true,
    },
  });

  if (!tx) throw new NotFoundError('Transaction');

  if (!isAdmin) {
    const userOwnsAccount =
      tx.fromAccount.userId === userId || tx.toAccount.userId === userId;
    if (!userOwnsAccount) {
      throw new AuthorizationError('You do not have access to this transaction');
    }
  }

  return tx;
};

/**
 * List all transactions (admin).
 */
const listAllTransactions = async ({ page = 1, limit = 20, status } = {}) => {
  const where = status ? { status } : {};
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

module.exports = { executeTransfer, getTransactionById, listAllTransactions };
