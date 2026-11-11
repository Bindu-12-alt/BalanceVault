'use strict';
require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');
const { getPrismaClient } = require('../../src/config/database');
const { createTestUser, approveOnboarding, cleanTestData } = require('../helpers');

const EMAIL_PREFIX = 'admintest';
const prisma = getPrismaClient();

let admin, regularUser;

beforeAll(async () => {
  admin = await createTestUser({ email: `${EMAIL_PREFIX}-admin@example.com`, role: 'ADMIN' });
  regularUser = await createTestUser({ email: `${EMAIL_PREFIX}-user@example.com` });
});

afterAll(async () => {
  await cleanTestData(EMAIL_PREFIX);
  await prisma.$disconnect();
});

describe('Admin access control', () => {
  it('admin can access dashboard stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('users');
  });

  it('regular user cannot access admin stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${regularUser.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('unauthenticated request cannot access admin routes', async () => {
    const res = await request(app).get('/api/v1/admin/users');
    expect(res.status).toBe(401);
  });

  it('admin can list users', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('users');
  });

  it('admin can view audit logs', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('logs');
  });

  it('admin can verify ledger', async () => {
    const res = await request(app)
      .get('/api/v1/admin/ledger/verify')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('isHealthy');
    expect(res.body.data).toHaveProperty('summary');
  });
});

describe('Onboarding approval', () => {
  let pendingUserId, onboardingId;

  beforeAll(async () => {
    const user = await createTestUser({ email: `${EMAIL_PREFIX}-pending@example.com` });
    pendingUserId = user.user.id;

    // Submit onboarding
    await request(app)
      .post('/api/v1/onboarding/submit')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        fullName: 'Pending User',
        dateOfBirth: '1992-06-15',
        address: '1 Test Lane',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        occupation: 'Developer',
        annualIncome: '800000',
        idType: 'AADHAAR',
        idNumber: 'PENDING1234',
      });

    const onb = await prisma.onboarding.findUnique({ where: { userId: pendingUserId } });
    onboardingId = onb.id;
  });

  it('admin can approve onboarding', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/onboarding/${onboardingId}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ decision: 'approve', reviewNote: 'All good' });
    expect(res.status).toBe(200);
    expect(res.body.data.application.status).toBe('APPROVED');
  });

  it('regular user cannot approve onboarding', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/onboarding/${onboardingId}/review`)
      .set('Authorization', `Bearer ${regularUser.accessToken}`)
      .send({ decision: 'approve' });
    expect(res.status).toBe(403);
  });
});
