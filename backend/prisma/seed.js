'use strict';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const BCRYPT_ROUNDS = 12;

  // --- Admin user ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@balancevault.internal';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  let admin;
  if (!existingAdmin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, BCRYPT_ROUNDS),
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`Created admin: ${adminEmail}`);
  } else {
    admin = existingAdmin;
    console.log(`Admin already exists: ${adminEmail}`);
  }

  // --- Demo user 1: Approved ---
  const user1Email = 'alice@example.com';
  let user1 = await prisma.user.findUnique({ where: { email: user1Email } });
  if (!user1) {
    user1 = await prisma.user.create({
      data: {
        email: user1Email,
        passwordHash: await bcrypt.hash('Alice@12345', BCRYPT_ROUNDS),
        firstName: 'Alice',
        lastName: 'Sharma',
        phone: '+919876543210',
        role: 'ACCOUNT_HOLDER',
      },
    });
    console.log(`Created user: ${user1Email}`);
  }

  // Onboarding for user1
  let onb1 = await prisma.onboarding.findUnique({ where: { userId: user1.id } });
  if (!onb1) {
    onb1 = await prisma.onboarding.create({
      data: {
        userId: user1.id,
        fullName: 'Alice Sharma',
        dateOfBirth: '1990-05-15',
        address: '42 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        occupation: 'Software Engineer',
        annualIncome: '1200000',
        idType: 'AADHAAR',
        idNumber: 'XXXX-XXXX-1234',
        status: 'APPROVED',
        reviewedById: admin.id,
        reviewNote: 'All documents verified',
        reviewedAt: new Date(),
      },
    });
  }

  // Account for user1
  let acct1 = await prisma.account.findFirst({ where: { userId: user1.id } });
  if (!acct1) {
    acct1 = await prisma.account.create({
      data: {
        accountNumber: 'BV1000000001',
        userId: user1.id,
        accountType: 'SAVINGS',
        status: 'ACTIVE',
        balance: 500000, // ₹5,000.00 in paise
      },
    });
    console.log(`Created account: ${acct1.accountNumber} with ₹5,000 balance`);
  }

  // --- Demo user 2: Approved ---
  const user2Email = 'bob@example.com';
  let user2 = await prisma.user.findUnique({ where: { email: user2Email } });
  if (!user2) {
    user2 = await prisma.user.create({
      data: {
        email: user2Email,
        passwordHash: await bcrypt.hash('Bob@12345', BCRYPT_ROUNDS),
        firstName: 'Bob',
        lastName: 'Patel',
        phone: '+919123456789',
        role: 'ACCOUNT_HOLDER',
      },
    });
    console.log(`Created user: ${user2Email}`);
  }

  let onb2 = await prisma.onboarding.findUnique({ where: { userId: user2.id } });
  if (!onb2) {
    onb2 = await prisma.onboarding.create({
      data: {
        userId: user2.id,
        fullName: 'Bob Patel',
        dateOfBirth: '1988-11-20',
        address: '15 Park Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        occupation: 'Business Analyst',
        annualIncome: '900000',
        idType: 'PAN',
        idNumber: 'ABCDE1234F',
        status: 'APPROVED',
        reviewedById: admin.id,
        reviewNote: 'Verified',
        reviewedAt: new Date(),
      },
    });
  }

  let acct2 = await prisma.account.findFirst({ where: { userId: user2.id } });
  if (!acct2) {
    acct2 = await prisma.account.create({
      data: {
        accountNumber: 'BV1000000002',
        userId: user2.id,
        accountType: 'SAVINGS',
        status: 'ACTIVE',
        balance: 300000, // ₹3,000.00 in paise
      },
    });
    console.log(`Created account: ${acct2.accountNumber} with ₹3,000 balance`);
  }

  // --- Demo user 3: Pending onboarding ---
  const user3Email = 'carol@example.com';
  let user3 = await prisma.user.findUnique({ where: { email: user3Email } });
  if (!user3) {
    user3 = await prisma.user.create({
      data: {
        email: user3Email,
        passwordHash: await bcrypt.hash('Carol@12345', BCRYPT_ROUNDS),
        firstName: 'Carol',
        lastName: 'Verma',
        role: 'ACCOUNT_HOLDER',
      },
    });
    console.log(`Created user: ${user3Email}`);
  }

  let onb3 = await prisma.onboarding.findUnique({ where: { userId: user3.id } });
  if (!onb3) {
    await prisma.onboarding.create({
      data: {
        userId: user3.id,
        fullName: 'Carol Verma',
        dateOfBirth: '1995-03-08',
        address: '7 Lake View',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        occupation: 'Teacher',
        annualIncome: '600000',
        idType: 'VOTER_ID',
        idNumber: 'ABC1234567',
        status: 'PENDING',
      },
    });
    console.log(`Created pending onboarding for: ${user3Email}`);
  }

  console.log('\n✅ Seed complete!');
  console.log('Admin login:', adminEmail, '/', adminPassword);
  console.log('Alice login: alice@example.com / Alice@12345');
  console.log('Bob login:   bob@example.com / Bob@12345');
  console.log('Carol login: carol@example.com / Carol@12345 (pending onboarding)');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
