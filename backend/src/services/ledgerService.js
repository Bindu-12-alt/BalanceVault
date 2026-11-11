'use strict';
const { getPrismaClient } = require('../config/database');

const prisma = () => getPrismaClient();

/**
 * Ledger verification report.
 * Checks:
 * 1. Every COMPLETED transaction has exactly one DEBIT and one CREDIT ledger entry.
 * 2. DEBIT and CREDIT amounts for each transaction match.
 * 3. DEBIT amount equals the transaction amount.
 * 4. No orphan ledger entries (entries without a transaction).
 * 5. Balance continuity: balanceAfter = balanceBefore - amount (DEBIT) or + amount (CREDIT).
 */
const verifyLedger = async () => {
  const issues = [];

  // --- Check 1 & 2 & 3: Transaction ↔ ledger entry matching ---
  const completedTransactions = await prisma().transaction.findMany({
    where: { status: 'COMPLETED' },
    include: { ledgerEntries: true },
    orderBy: { createdAt: 'asc' },
  });

  let verifiedCount = 0;
  let mismatchCount = 0;

  for (const tx of completedTransactions) {
    const debits = tx.ledgerEntries.filter((e) => e.entryType === 'DEBIT');
    const credits = tx.ledgerEntries.filter((e) => e.entryType === 'CREDIT');

    if (debits.length !== 1) {
      issues.push({ type: 'MISSING_OR_DUPLICATE_DEBIT', transactionId: tx.id, detail: `Expected 1 debit, found ${debits.length}` });
      mismatchCount++;
      continue;
    }
    if (credits.length !== 1) {
      issues.push({ type: 'MISSING_OR_DUPLICATE_CREDIT', transactionId: tx.id, detail: `Expected 1 credit, found ${credits.length}` });
      mismatchCount++;
      continue;
    }

    const debit = debits[0];
    const credit = credits[0];

    if (debit.amount !== credit.amount) {
      issues.push({ type: 'AMOUNT_MISMATCH', transactionId: tx.id, detail: `Debit ${debit.amount} ≠ Credit ${credit.amount}` });
      mismatchCount++;
    } else if (debit.amount !== tx.amount) {
      issues.push({ type: 'LEDGER_TX_AMOUNT_MISMATCH', transactionId: tx.id, detail: `Ledger amount ${debit.amount} ≠ Transaction amount ${tx.amount}` });
      mismatchCount++;
    } else {
      // Balance continuity
      const debitContinuity = debit.balanceBefore - debit.amount === debit.balanceAfter;
      const creditContinuity = credit.balanceBefore + credit.amount === credit.balanceAfter;
      if (!debitContinuity) {
        issues.push({ type: 'DEBIT_BALANCE_CONTINUITY', transactionId: tx.id, detail: `Debit: before(${debit.balanceBefore}) - amount(${debit.amount}) ≠ after(${debit.balanceAfter})` });
        mismatchCount++;
      } else if (!creditContinuity) {
        issues.push({ type: 'CREDIT_BALANCE_CONTINUITY', transactionId: tx.id, detail: `Credit: before(${credit.balanceBefore}) + amount(${credit.amount}) ≠ after(${credit.balanceAfter})` });
        mismatchCount++;
      } else {
        verifiedCount++;
      }
    }
  }

  // --- Check 4: Orphan ledger entries ---
  const orphanEntries = await prisma().$queryRaw`
    SELECT le.id, le."transactionId"
    FROM "LedgerEntry" le
    LEFT JOIN "Transaction" t ON t.id = le."transactionId"
    WHERE t.id IS NULL
  `;
  if (orphanEntries.length > 0) {
    issues.push({
      type: 'ORPHAN_LEDGER_ENTRIES',
      detail: `Found ${orphanEntries.length} ledger entries with no matching transaction`,
      entries: orphanEntries.map((e) => e.id),
    });
  }

  // --- Summary ---
  const totalTransactions = completedTransactions.length;
  const isHealthy = issues.length === 0;

  return {
    isHealthy,
    summary: {
      totalTransactions,
      verifiedTransactions: verifiedCount,
      issueCount: issues.length + orphanEntries.length,
      orphanEntries: orphanEntries.length,
    },
    issues,
    verifiedAt: new Date().toISOString(),
  };
};

/**
 * Get ledger entries for an account (admin or owner).
 */
const getAccountLedger = async (accountId, { page = 1, limit = 50 } = {}) => {
  const [entries, total] = await Promise.all([
    prisma().ledgerEntry.findMany({
      where: { accountId },
      include: {
        transaction: {
          select: { id: true, amount: true, description: true, createdAt: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma().ledgerEntry.count({ where: { accountId } }),
  ]);
  return { entries, total, page, limit };
};

module.exports = { verifyLedger, getAccountLedger };
