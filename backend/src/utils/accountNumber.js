'use strict';
/**
 * Generates a unique 12-digit account number.
 * Format: BV + 10 random digits (e.g., BV3847261904)
 */

const { getPrismaClient } = require('../config/database');

const generateAccountNumber = () => {
  // 10 random digits, zero-padded
  const digits = Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000;
  return `BV${digits}`;
};

/**
 * Generates a unique account number, retrying on collision.
 */
const createUniqueAccountNumber = async (maxAttempts = 10) => {
  const prisma = getPrismaClient();

  for (let i = 0; i < maxAttempts; i++) {
    const number = generateAccountNumber();
    const existing = await prisma.account.findUnique({ where: { accountNumber: number } });
    if (!existing) return number;
  }

  throw new Error('Failed to generate unique account number after maximum attempts');
};

module.exports = { createUniqueAccountNumber };
