'use strict';
const bcrypt = require('bcrypt');
const { getPrismaClient } = require('../src/config/database');
const authService = require('../src/services/authService');

const prisma = () => getPrismaClient();

/**
 * Create a test user and return user + tokens.
 */
const createTestUser = async ({
  email = `test-${Date.now()}@example.com`,
  password = 'Test@12345',
  firstName = 'Test',
  lastName = 'User',
  role = 'ACCOUNT_HOLDER',
  isActive = true,
} = {}) => {
  const passwordHash = await bcrypt.hash(password, 10); // faster rounds for tests
  const user = await prisma().user.create({
    data: { email, passwordHash, firstName, lastName, role, isActive },
  });
  const { accessToken } = await authService.login({ email, password });
  return { user, accessToken, password };
};

/**
 * Create an approved onboarding record for a user.
 */
const approveOnboarding = async (userId, adminId) => {
  return prisma().onboarding.upsert({
    where: { userId },
    create: {
      userId,
      fullName: 'Test User',
      dateOfBirth: '1990-01-01',
      address: '123 Test St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      occupation: 'Engineer',
      annualIncome: '1000000',
      idType: 'AADHAAR',
      idNumber: 'TEST1234',
      status: 'APPROVED',
      reviewedById: adminId,
      reviewNote: 'Test approval',
      reviewedAt: new Date(),
    },
    update: { status: 'APPROVED' },
  });
};

/**
 * Create an ACTIVE account with a given balance (in paise).
 */
const createTestAccount = async (userId, balancePaise = 100000) => {
  const number = `TV${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return prisma().account.create({
    data: {
      accountNumber: number,
      userId,
      accountType: 'SAVINGS',
      status: 'ACTIVE',
      balance: balancePaise,
    },
  });
};

/**
 * Clean specific test users by email prefix (for test isolation).
 */
const cleanTestData = async (emailPattern) => {
  const users = await prisma().user.findMany({
    where: { email: { contains: emailPattern } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) return;

  await prisma().idempotencyRecord.deleteMany({ where: { userId: { in: userIds } } });
  const accounts = await prisma().account.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
  const accountIds = accounts.map((a) => a.id);
  if (accountIds.length > 0) {
    await prisma().ledgerEntry.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma().transaction.deleteMany({
      where: { OR: [{ fromAccountId: { in: accountIds } }, { toAccountId: { in: accountIds } }] },
    });
  }
  await prisma().account.deleteMany({ where: { userId: { in: userIds } } });
  await prisma().onboarding.deleteMany({ where: { userId: { in: userIds } } });
  await prisma().auditLog.deleteMany({ where: { actorId: { in: userIds } } });
  await prisma().user.deleteMany({ where: { id: { in: userIds } } });
};

module.exports = { createTestUser, approveOnboarding, createTestAccount, cleanTestData };
