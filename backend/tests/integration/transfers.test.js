'use strict';
require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');
const { getPrismaClient } = require('../../src/config/database');
const { createTestUser, approveOnboarding, createTestAccount, cleanTestData } = require('../helpers');

const EMAIL_PREFIX = 'transfertest';
const prisma = getPrismaClient();

let sender, senderAcct, receiver, receiverAcct, adminUser;

beforeAll(async () => {
  adminUser = await createTestUser({ email: `${EMAIL_PREFIX}-admin@example.com`, role: 'ADMIN' });
  sender = await createTestUser({ email: `${EMAIL_PREFIX}-sender@example.com` });
  receiver = await createTestUser({ email: `${EMAIL_PREFIX}-receiver@example.com` });

  await approveOnboarding(sender.user.id, adminUser.user.id);
  await approveOnboarding(receiver.user.id, adminUser.user.id);

  senderAcct = await createTestAccount(sender.user.id, 100000); // ₹1,000
  receiverAcct = await createTestAccount(receiver.user.id, 50000); // ₹500
});

afterAll(async () => {
  await cleanTestData(EMAIL_PREFIX);
  await prisma.$disconnect();
});

const makeTransfer = (body, token) =>
  request(app)
    .post('/api/v1/transfers')
    .set('Authorization', `Bearer ${token}`)
    .send(body);

describe('POST /api/v1/transfers', () => {
  it('transfers money successfully', async () => {
    const key = `idem-success-${Date.now()}`;
    const res = await makeTransfer({
      fromAccountId: senderAcct.id,
      toAccountId: receiverAcct.id,
      amount: '100.00',
      idempotencyKey: key,
    }, sender.accessToken);

    expect(res.status).toBe(201);
    expect(res.body.data.transaction.status).toBe('COMPLETED');

    // Verify balances
    const updatedSender = await prisma.account.findUnique({ where: { id: senderAcct.id } });
    const updatedReceiver = await prisma.account.findUnique({ where: { id: receiverAcct.id } });
    expect(updatedSender.balance).toBe(90000); // ₹900
    expect(updatedReceiver.balance).toBe(60000); // ₹600
  });

  it('creates double-entry ledger entries', async () => {
    const key = `idem-ledger-${Date.now()}`;
    const res = await makeTransfer({
      fromAccountId: senderAcct.id,
      toAccountId: receiverAcct.id,
      amount: '50.00',
      idempotencyKey: key,
    }, sender.accessToken);

    expect(res.status).toBe(201);
    const txId = res.body.data.transaction.id;

    const entries = await prisma.ledgerEntry.findMany({ where: { transactionId: txId } });
    expect(entries).toHaveLength(2);

    const debit = entries.find((e) => e.entryType === 'DEBIT');
    const credit = entries.find((e) => e.entryType === 'CREDIT');
    expect(debit).toBeDefined();
    expect(credit).toBeDefined();
    expect(debit.amount).toBe(5000);
    expect(credit.amount).toBe(5000);
    expect(debit.amount).toBe(credit.amount);
  });

  it('is idempotent — same key returns cached result', async () => {
    const key = `idem-dupe-${Date.now()}`;
    const body = { fromAccountId: senderAcct.id, toAccountId: receiverAcct.id, amount: '10.00', idempotencyKey: key };

    const res1 = await makeTransfer(body, sender.accessToken);
    expect(res1.status).toBe(201);

    const res2 = await makeTransfer(body, sender.accessToken);
    expect(res2.status).toBe(200);
    expect(res2.body.data.cached).toBe(true);
  });

  it('rejects insufficient balance', async () => {
    const res = await makeTransfer({
      fromAccountId: senderAcct.id,
      toAccountId: receiverAcct.id,
      amount: '999999.00',
      idempotencyKey: `idem-insufficient-${Date.now()}`,
    }, sender.accessToken);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INSUFFICIENT_FUNDS');
  });

  it('rejects transfer from account not owned by sender', async () => {
    const res = await makeTransfer({
      fromAccountId: receiverAcct.id, // receiver's account
      toAccountId: senderAcct.id,
      amount: '10.00',
      idempotencyKey: `idem-ownership-${Date.now()}`,
    }, sender.accessToken); // but using sender's token
    expect(res.status).toBe(403);
  });

  it('rejects transfer to same account', async () => {
    const res = await makeTransfer({
      fromAccountId: senderAcct.id,
      toAccountId: senderAcct.id,
      amount: '10.00',
      idempotencyKey: `idem-same-${Date.now()}`,
    }, sender.accessToken);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('SAME_ACCOUNT');
  });

  it('rejects unauthenticated transfer', async () => {
    const res = await request(app).post('/api/v1/transfers').send({
      fromAccountId: senderAcct.id,
      toAccountId: receiverAcct.id,
      amount: '10.00',
      idempotencyKey: `idem-unauth-${Date.now()}`,
    });
    expect(res.status).toBe(401);
  });
});

describe('Admin-only access to transfers', () => {
  it('admin can view any transaction', async () => {
    // First create a transaction
    const key = `idem-admin-view-${Date.now()}`;
    const transferRes = await makeTransfer({
      fromAccountId: senderAcct.id,
      toAccountId: receiverAcct.id,
      amount: '5.00',
      idempotencyKey: key,
    }, sender.accessToken);
    const txId = transferRes.body.data.transaction.id;

    const res = await request(app)
      .get(`/api/v1/transfers/${txId}`)
      .set('Authorization', `Bearer ${adminUser.accessToken}`);
    expect(res.status).toBe(200);
  });

  it('user cannot view another user\'s transaction', async () => {
    // create an account for a 3rd user
    const user3 = await createTestUser({ email: `${EMAIL_PREFIX}-user3@example.com` });
    await approveOnboarding(user3.user.id, adminUser.user.id);
    const acct3 = await createTestAccount(user3.user.id, 100000);

    const key = `idem-other-${Date.now()}`;
    const transferRes = await makeTransfer({
      fromAccountId: senderAcct.id,
      toAccountId: receiverAcct.id,
      amount: '5.00',
      idempotencyKey: key,
    }, sender.accessToken);
    const txId = transferRes.body.data.transaction.id;

    const res = await request(app)
      .get(`/api/v1/transfers/${txId}`)
      .set('Authorization', `Bearer ${user3.accessToken}`);
    expect(res.status).toBe(403);
  });
});
