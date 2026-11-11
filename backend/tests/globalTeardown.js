'use strict';
const { PrismaClient } = require('@prisma/client');

module.exports = async () => {
  const prisma = new PrismaClient();
  try {
    // Clean up test data in correct dependency order
    await prisma.idempotencyRecord.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.ledgerEntry.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.onboarding.deleteMany();
    await prisma.user.deleteMany();
  } finally {
    await prisma.$disconnect();
  }
};
